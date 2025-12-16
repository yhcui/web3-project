import mysql from 'mysql2/promise';

// 数据库配置
export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dex_scanner',
  charset: 'utf8mb4',
  timezone: '+00:00',
};

// 创建数据库连接池
export const pool = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 数据库表结构定义
export const TABLE_SCHEMAS = {
  // 交易表
  swaps: `
    CREATE TABLE IF NOT EXISTS swaps (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      transaction_hash VARCHAR(66) NOT NULL UNIQUE,
      block_number BIGINT NOT NULL,
      block_timestamp TIMESTAMP NOT NULL,
      pool_address VARCHAR(42) NOT NULL,
      sender VARCHAR(42) NOT NULL,
      recipient VARCHAR(42) NOT NULL,
      token_in VARCHAR(42) NOT NULL,
      token_out VARCHAR(42) NOT NULL,
      amount_in DECIMAL(78, 0) NOT NULL,
      amount_out DECIMAL(78, 0) NOT NULL,
      sqrt_price_x96 DECIMAL(78, 0) NOT NULL,
      liquidity DECIMAL(78, 0) NOT NULL,
      tick INT NOT NULL,
      gas_used BIGINT NOT NULL,
      gas_price BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pool_address (pool_address),
      INDEX idx_block_number (block_number),
      INDEX idx_timestamp (block_timestamp),
      INDEX idx_sender (sender),
      INDEX idx_token_pair (token_in, token_out)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
  
  // 流动性变动表
  liquidity_changes: `
    CREATE TABLE IF NOT EXISTS liquidity_changes (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      transaction_hash VARCHAR(66) NOT NULL,
      block_number BIGINT NOT NULL,
      block_timestamp TIMESTAMP NOT NULL,
      pool_address VARCHAR(42) NOT NULL,
      position_id BIGINT,
      owner VARCHAR(42) NOT NULL,
      change_type ENUM('mint', 'burn') NOT NULL,
      amount0 DECIMAL(78, 0) NOT NULL,
      amount1 DECIMAL(78, 0) NOT NULL,
      liquidity DECIMAL(78, 0) NOT NULL,
      tick_lower INT NOT NULL,
      tick_upper INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pool_address (pool_address),
      INDEX idx_owner (owner),
      INDEX idx_block_number (block_number),
      INDEX idx_timestamp (block_timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
  
  // 池子信息表
  pools: `
    CREATE TABLE IF NOT EXISTS pools (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      pool_address VARCHAR(42) NOT NULL UNIQUE,
      token0 VARCHAR(42) NOT NULL,
      token1 VARCHAR(42) NOT NULL,
      fee BIGINT NOT NULL,
      tick_spacing INT NOT NULL,
      created_block BIGINT NOT NULL,
      created_timestamp TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token_pair (token0, token1),
      INDEX idx_fee (fee)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
  
  // 扫描状态表
  scan_status: `
    CREATE TABLE IF NOT EXISTS scan_status (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contract_address VARCHAR(42) NOT NULL UNIQUE,
      last_scanned_block BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
  
  // 代币信息表
  tokens: `
    CREATE TABLE IF NOT EXISTS tokens (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      address VARCHAR(42) NOT NULL UNIQUE,
      symbol VARCHAR(32) NOT NULL,
      name VARCHAR(256) NOT NULL,
      decimals INT NOT NULL,
      total_supply DECIMAL(78, 0),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_symbol (symbol)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `
};

// 初始化数据库表
export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    console.log('正在初始化数据库表...');
    
    for (const [tableName, schema] of Object.entries(TABLE_SCHEMAS)) {
      await connection.execute(schema);
      console.log(`已创建表: ${tableName}`);
    }
    
    // 插入默认的代币信息
    const defaultTokens = [
      ['0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', 'WETH', 'Wrapped Ethereum', 18, null],
      ['0x4798388e3adE569570Df626040F07DF71135C48E', 'MNA', 'MetaNode Token A', 18, null],
      ['0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30', 'MNB', 'MetaNode Token B', 18, null],
      ['0x86B5df6FF459854ca91318274E47F4eEE245CF28', 'MNC', 'MetaNode Token C', 18, null],
      ['0x7af86B1034AC4C925Ef5C3F637D1092310d83F03', 'MND', 'MetaNode Token D', 18, null],
    ];
    
    for (const token of defaultTokens) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO tokens (address, symbol, name, decimals, total_supply) VALUES (?, ?, ?, ?, ?)',
          token
        );
      } catch {
        // 忽略重复插入错误
      }
    }
    
    // 初始化扫描状态
    const contracts = [
      '0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B', // POOL_MANAGER
      '0xbe766Bf20eFfe431829C5d5a2744865974A0B610', // POSITION_MANAGER
      '0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2', // SWAP_ROUTER
    ];
    
    for (const contractAddress of contracts) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO scan_status (contract_address, last_scanned_block) VALUES (?, ?)',
          [contractAddress, 0]
        );
      } catch {
        // 忽略重复插入错误
      }
    }
    
    connection.release();
    console.log('数据库初始化完成!');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 获取数据库连接
export async function getConnection() {
  return await pool.getConnection();
}

// 关闭数据库连接池
export async function closePool() {
  await pool.end();
} 