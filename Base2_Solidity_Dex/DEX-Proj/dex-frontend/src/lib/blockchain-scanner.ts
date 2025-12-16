import { createPublicClient, http, Log, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import { getConnection } from './database';
import { CONTRACTS } from './constants';

// 创建公共客户端连接
const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'),
});

// 事件签名定义
export const EVENT_SIGNATURES = {
  // Swap 事件 (来自池子合约)
  Swap: parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'),
  
  // 流动性变更事件
  Mint: parseAbiItem('event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)'),
  Burn: parseAbiItem('event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)'),
  
  // 池子创建事件
  PoolCreated: parseAbiItem('event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)'),
  
  // Position NFT 事件
  IncreaseLiquidity: parseAbiItem('event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'),
  DecreaseLiquidity: parseAbiItem('event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'),
};

// 区块链扫描器类
export class BlockchainScanner {
  private isRunning = false;
  private scanInterval: number;
  private batchSize: number;

  constructor(
    scanInterval = 5000,  // 5秒扫描一次
    batchSize = 1000      // 每次扫描1000个块
  ) {
    this.scanInterval = scanInterval;
    this.batchSize = batchSize;
  }

  // 开始扫描
  async start() {
    if (this.isRunning) {
      console.log('扫描器已在运行中...');
      return;
    }

    this.isRunning = true;
    console.log('开始区块链扫描...');

    while (this.isRunning) {
      try {
        await this.scanLatestBlocks();
        await new Promise(resolve => setTimeout(resolve, this.scanInterval));
      } catch (error) {
        console.error('扫描过程中出错:', error);
        await new Promise(resolve => setTimeout(resolve, this.scanInterval * 2));
      }
    }
  }

  // 停止扫描
  stop() {
    this.isRunning = false;
    console.log('已停止区块链扫描');
  }

  // 扫描最新块
  private async scanLatestBlocks() {
    const connection = await getConnection();
    
    try {
      // 获取当前最新块号
      const latestBlock = await client.getBlockNumber();
      
      // 扫描每个合约
      for (const [contractName, contractAddress] of Object.entries(CONTRACTS)) {
        await this.scanContract(contractAddress, latestBlock, connection);
      }
      
    } finally {
      connection.release();
    }
  }

  // 扫描特定合约
  private async scanContract(contractAddress: string, latestBlock: bigint, connection: any) {
    // 获取上次扫描的块号
    const [rows] = await connection.execute(
      'SELECT last_scanned_block FROM scan_status WHERE contract_address = ?',
      [contractAddress]
    );

    let fromBlock = BigInt(0);
    if (rows.length > 0) {
      fromBlock = BigInt(rows[0].last_scanned_block) + BigInt(1);
    }

    if (fromBlock > latestBlock) {
      return; // 已经是最新的了
    }

    // 分批扫描
    const toBlock = fromBlock + BigInt(this.batchSize) > latestBlock 
      ? latestBlock 
      : fromBlock + BigInt(this.batchSize);

    console.log(`扫描合约 ${contractAddress} 从块 ${fromBlock} 到 ${toBlock}`);

    try {
      // 根据合约类型扫描不同的事件
      if (contractAddress === CONTRACTS.POOL_MANAGER) {
        await this.scanPoolManagerEvents(fromBlock, toBlock, connection);
      } else if (contractAddress === CONTRACTS.POSITION_MANAGER) {
        await this.scanPositionManagerEvents(fromBlock, toBlock, connection);
      } else if (contractAddress === CONTRACTS.SWAP_ROUTER) {
        await this.scanSwapRouterEvents(fromBlock, toBlock, connection);
      }

      // 更新扫描状态
      await connection.execute(
        'UPDATE scan_status SET last_scanned_block = ?, updated_at = NOW() WHERE contract_address = ?',
        [toBlock.toString(), contractAddress]
      );

    } catch (error) {
      console.error(`扫描合约 ${contractAddress} 时出错:`, error);
    }
  }

  // 扫描 PoolManager 事件
  private async scanPoolManagerEvents(fromBlock: bigint, toBlock: bigint, connection: any) {
    const logs = await client.getLogs({
      address: CONTRACTS.POOL_MANAGER as `0x${string}`,
      fromBlock,
      toBlock,
      events: [EVENT_SIGNATURES.PoolCreated],
    });

    for (const log of logs) {
      await this.processPoolCreatedEvent(log, connection);
    }
  }

  // 扫描 PositionManager 事件
  private async scanPositionManagerEvents(fromBlock: bigint, toBlock: bigint, connection: any) {
    const logs = await client.getLogs({
      address: CONTRACTS.POSITION_MANAGER as `0x${string}`,
      fromBlock,
      toBlock,
      events: [
        EVENT_SIGNATURES.IncreaseLiquidity,
        EVENT_SIGNATURES.DecreaseLiquidity,
      ],
    });

    for (const log of logs) {
      if (log.eventName === 'IncreaseLiquidity') {
        await this.processLiquidityChangeEvent(log, 'mint', connection);
      } else if (log.eventName === 'DecreaseLiquidity') {
        await this.processLiquidityChangeEvent(log, 'burn', connection);
      }
    }
  }

  // 扫描 SwapRouter 事件（这里主要是扫描所有池子的 Swap 事件）
  private async scanSwapRouterEvents(fromBlock: bigint, toBlock: bigint, connection: any) {
    // 获取所有池子地址
    const [pools] = await connection.execute('SELECT pool_address FROM pools');
    
    for (const pool of pools) {
      const logs = await client.getLogs({
        address: pool.pool_address as `0x${string}`,
        fromBlock,
        toBlock,
        events: [EVENT_SIGNATURES.Swap],
      });

      for (const log of logs) {
        await this.processSwapEvent(log, connection);
      }
    }
  }

  // 处理池子创建事件
  private async processPoolCreatedEvent(log: any, connection: any) {
    const { token0, token1, fee, tickSpacing, pool } = log.args;
    
    // 获取块的时间戳
    const block = await client.getBlock({ blockNumber: log.blockNumber });
    
    try {
      await connection.execute(
        `INSERT IGNORE INTO pools 
         (pool_address, token0, token1, fee, tick_spacing, created_block, created_timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))`,
        [
          pool,
          token0,
          token1,
          fee,
          tickSpacing,
          log.blockNumber.toString(),
          block.timestamp.toString()
        ]
      );
      
      console.log(`已保存池子创建事件: ${pool}`);
    } catch (error) {
      console.error('保存池子创建事件失败:', error);
    }
  }

  // 处理交易事件
  private async processSwapEvent(log: any, connection: any) {
    const { sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick } = log.args;
    
    // 获取交易详情
    const transaction = await client.getTransaction({ hash: log.transactionHash });
    const receipt = await client.getTransactionReceipt({ hash: log.transactionHash });
    const block = await client.getBlock({ blockNumber: log.blockNumber });
    
    // 确定 tokenIn 和 tokenOut
    const isToken0Input = amount0 > 0;
    const tokenIn = isToken0Input ? await this.getPoolToken0(log.address) : await this.getPoolToken1(log.address);
    const tokenOut = isToken0Input ? await this.getPoolToken1(log.address) : await this.getPoolToken0(log.address);
    const amountIn = isToken0Input ? amount0 : amount1;
    const amountOut = isToken0Input ? -amount1 : -amount0;
    
    try {
      await connection.execute(
        `INSERT IGNORE INTO swaps 
         (transaction_hash, block_number, block_timestamp, pool_address, sender, recipient, 
          token_in, token_out, amount_in, amount_out, sqrt_price_x96, liquidity, tick, 
          gas_used, gas_price) 
         VALUES (?, ?, FROM_UNIXTIME(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.transactionHash,
          log.blockNumber.toString(),
          block.timestamp.toString(),
          log.address,
          sender,
          recipient,
          tokenIn,
          tokenOut,
          amountIn.toString(),
          amountOut.toString(),
          sqrtPriceX96.toString(),
          liquidity.toString(),
          tick,
          receipt.gasUsed.toString(),
          transaction.gasPrice?.toString() || '0'
        ]
      );
      
      console.log(`已保存交易事件: ${log.transactionHash}`);
    } catch (error) {
      console.error('保存交易事件失败:', error);
    }
  }

  // 处理流动性变更事件
  private async processLiquidityChangeEvent(log: any, changeType: 'mint' | 'burn', connection: any) {
    const { tokenId, liquidity, amount0, amount1 } = log.args;
    
    // 获取交易详情
    const transaction = await client.getTransaction({ hash: log.transactionHash });
    const block = await client.getBlock({ blockNumber: log.blockNumber });
    
    try {
      await connection.execute(
        `INSERT INTO liquidity_changes 
         (transaction_hash, block_number, block_timestamp, pool_address, position_id, 
          owner, change_type, amount0, amount1, liquidity, tick_lower, tick_upper) 
         VALUES (?, ?, FROM_UNIXTIME(?), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.transactionHash,
          log.blockNumber.toString(),
          block.timestamp.toString(),
          '0x0000000000000000000000000000000000000000', // 需要从 position 获取真实池子地址
          tokenId.toString(),
          transaction.from,
          changeType,
          amount0.toString(),
          amount1.toString(),
          liquidity.toString(),
          0, // 需要从 position 获取真实 tick
          0  // 需要从 position 获取真实 tick
        ]
      );
      
      console.log(`已保存流动性变更事件: ${log.transactionHash}`);
    } catch (error) {
      console.error('保存流动性变更事件失败:', error);
    }
  }

  // 获取池子的 token0 地址
  private async getPoolToken0(poolAddress: string): Promise<string> {
    // 这里需要调用池子合约的 token0() 方法
    // 由于我们没有完整的池子 ABI，先从数据库查询
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT token0 FROM pools WHERE pool_address = ?',
        [poolAddress]
      );
      return (rows as any[]).length > 0 ? (rows as any[])[0].token0 : '0x0000000000000000000000000000000000000000';
    } finally {
      connection.release();
    }
  }

  // 获取池子的 token1 地址
  private async getPoolToken1(poolAddress: string): Promise<string> {
    // 这里需要调用池子合约的 token1() 方法
    // 由于我们没有完整的池子 ABI，先从数据库查询
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT token1 FROM pools WHERE pool_address = ?',
        [poolAddress]
      );
      return (rows as any[]).length > 0 ? (rows as any[])[0].token1 : '0x0000000000000000000000000000000000000000';
    } finally {
      connection.release();
    }
  }
}

// 导出单例扫描器实例
export const scanner = new BlockchainScanner(); 