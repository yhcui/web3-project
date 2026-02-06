/**
 * CoinRollCore Service Layer
 * Handles complex contract operations and business logic
 * Following the smart contract integration standard
 */

import {
  PublicClient,
  WalletClient,
  Address,
  parseEther,
  formatEther,
  Hex,
  keccak256,
} from 'viem'
import CoinRollCoreABI from '@/contracts/abis/CoinRollCore.json'
import { getCoinRollCoreAddress } from '@/contracts/addresses'
import {
  TokenInfo,
  BondingCurveParams,
  CreateTokenParams,
  CreateTokenData,
  TokenStatus,
  TokenMetrics,
  COINROLL_CORE_CONSTANTS,
} from '@/contracts/types/coinrollCore'
import {
  validateCreateTokenParams,
  validateCalculateInitialBuyParams,
} from '@/contracts/utils/validation'
import {
  parseContractError,
  handleContractError,
} from '@/contracts/utils/errors'

/**
 * Service class for CoinRollCore contract operations
 */
export class CoinRollCoreService {
  private contractAddress: Address

  constructor(
    private publicClient: PublicClient,
    private walletClient?: WalletClient,
    private chainId?: number
  ) {
    this.contractAddress = getCoinRollCoreAddress(
      chainId || publicClient.chain?.id || 97 // Default to BSC testnet
    )
  }

  // ============================================================================
  // Token Information
  // ============================================================================

  /**
   * Get comprehensive token information
   */
  async getTokenInfo(tokenAddress: Address): Promise<TokenInfo | null> {
    try {
      const info = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'getTokenInfo',
        args: [tokenAddress],
      })

      return info as TokenInfo
    } catch (error) {
      console.error('Failed to get token info:', error)
      return null
    }
  }

  /**
   * Get bonding curve parameters for a token
   */
  async getBondingCurve(
    tokenAddress: Address
  ): Promise<BondingCurveParams | null> {
    try {
      const curve = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'getBondingCurve',
        args: [tokenAddress],
      })

      return curve as BondingCurveParams
    } catch (error) {
      console.error('Failed to get bonding curve:', error)
      return null
    }
  }

  /**
   * Get token metrics (price, market cap, etc.)
   */
  async getTokenMetrics(tokenAddress: Address): Promise<TokenMetrics | null> {
    try {
      const [tokenInfo, bondingCurve] = await Promise.all([
        this.getTokenInfo(tokenAddress),
        this.getBondingCurve(tokenAddress),
      ])

      if (!tokenInfo || !bondingCurve) {
        return null
      }

      // Calculate price from bonding curve
      // Price = virtualBNBReserve / virtualTokenReserve
      const price =
        (bondingCurve.virtualBNBReserve * BigInt(1e18)) /
        bondingCurve.virtualTokenReserve

      // Calculate market cap
      // Market Cap = price * totalSupply
      const totalSupply =
        bondingCurve.virtualTokenReserve + bondingCurve.availableTokens
      const marketCap = (price * totalSupply) / BigInt(1e18)

      // Calculate bonding progress (how close to graduation)
      const targetBNB = COINROLL_CORE_CONSTANTS.MIN_LIQUIDITY
      const progress = Number(
        (bondingCurve.collectedBNB * BigInt(100)) / targetBNB
      )

      return {
        marketCap,
        price,
        holders: 0, // Would need to fetch from events or indexer
        volume24h: BigInt(0), // Would need to fetch from events or indexer
        priceChange24h: 0, // Would need historical data
        bondingProgress: Math.min(progress, 100),
      }
    } catch (error) {
      console.error('Failed to get token metrics:', error)
      return null
    }
  }

  // ============================================================================
  // Token Creation
  // ============================================================================

  /**
   * Create a new token with all necessary steps
   */
  async createToken(params: CreateTokenParams): Promise<{
    hash: Hex
    tokenAddress?: Address
  }> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for token creation')
    }

    try {
      // Validate parameters
      validateCreateTokenParams(params)

      // Encode data for signature
      const data = this.encodeTokenData(params)

      // Get signature from backend
      const signature = await this.getCreateTokenSignature(data, params)

      // Calculate required value
      const value = this.calculateRequiredValue(params)

      // Simulate transaction first
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'createToken',
        args: [data, signature],
        value,
        account: this.walletClient.account!,
      })

      // Execute transaction
      const hash = await this.walletClient.writeContract(request)

      // Wait for confirmation and get token address
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      })
      const tokenAddress = this.parseTokenAddressFromReceipt(receipt)

      return { hash, tokenAddress }
    } catch (error) {
      handleContractError(error)
      throw error
    }
  }

  /**
   * Encode token data for contract call
   */
  private encodeTokenData(params: CreateTokenParams): Hex {
    // Implementation would depend on exact encoding required by contract
    // This is a simplified version
    const encoded = keccak256(
      Buffer.from(
        JSON.stringify({
          requestId: params.requestId,
          timestamp: params.timestamp,
          creator: params.creator,
          name: params.name,
          symbol: params.symbol,
          totalSupply: params.totalSupply,
          virtualBNBReserve: params.virtualBNBReserve,
          virtualTokenReserve: params.virtualTokenReserve,
          initialBuyPercentageBP: params.initialBuyPercentageBP,
          metadata: params.metadata,
        })
      )
    )

    return encoded as Hex
  }

  /**
   * Get signature from backend API
   */
  private async getCreateTokenSignature(
    data: Hex,
    params: CreateTokenParams
  ): Promise<Hex> {
    // TODO: Implement actual API call
    // This would call your backend API to get the signature
    console.warn('Using mock signature - implement actual API call')
    return ('0x' + '00'.repeat(65)) as Hex
  }

  /**
   * Calculate required BNB value for token creation
   */
  private calculateRequiredValue(params: CreateTokenParams): bigint {
    let value = BigInt(0)

    // Add initial buy value if specified
    if (params.initialBuyPercentageBP && params.initialBuyPercentageBP > 0) {
      // Calculate using the bonding curve formula
      const saleAmount = parseEther(params.totalSupply)
      const virtualBNB = params.virtualBNBReserve
        ? parseEther(params.virtualBNBReserve)
        : COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_BNB_RESERVE
      const virtualToken = params.virtualTokenReserve
        ? parseEther(params.virtualTokenReserve)
        : COINROLL_CORE_CONSTANTS.DEFAULT_VIRTUAL_TOKEN_RESERVE

      const tokensToBuy =
        (saleAmount * BigInt(params.initialBuyPercentageBP)) / BigInt(10000)
      const k = virtualBNB * virtualToken
      const newVirtualToken = virtualToken - tokensToBuy
      const requiredBNB = k / newVirtualToken - virtualBNB

      value += requiredBNB
    }

    return value
  }

  /**
   * Parse token address from transaction receipt
   */
  private parseTokenAddressFromReceipt(receipt: any): Address | undefined {
    // Find TokenCreated event
    const tokenCreatedTopic = keccak256(
      Buffer.from('TokenCreated(address,address,string,string,uint256,bytes32)')
    )

    const event = receipt.logs.find(
      (log: any) => log.topics[0] === tokenCreatedTopic
    )

    if (event && event.topics[1]) {
      return `0x${event.topics[1].slice(26)}` as Address
    }

    return undefined
  }

  // ============================================================================
  // Trading Operations
  // ============================================================================

  /**
   * Calculate token amount for a given BNB input
   */
  async calculateBuyAmount(
    tokenAddress: Address,
    bnbAmount: string
  ): Promise<bigint> {
    try {
      const amount = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'calculateBuyAmount',
        args: [tokenAddress, parseEther(bnbAmount)],
      })

      return amount as bigint
    } catch (error) {
      console.error('Failed to calculate buy amount:', error)
      throw error
    }
  }

  /**
   * Calculate BNB return for selling tokens
   */
  async calculateSellReturn(
    tokenAddress: Address,
    tokenAmount: string
  ): Promise<bigint> {
    try {
      const amount = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'calculateSellReturn',
        args: [tokenAddress, parseEther(tokenAmount)],
      })

      return amount as bigint
    } catch (error) {
      console.error('Failed to calculate sell return:', error)
      throw error
    }
  }

  /**
   * Buy tokens with BNB
   */
  async buyTokens(
    tokenAddress: Address,
    bnbAmount: string,
    minTokenAmount: string,
    deadline?: number
  ): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for buying tokens')
    }

    try {
      const deadlineTimestamp = deadline || Math.floor(Date.now() / 1000) + 300 // 5 minutes

      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'buy',
        args: [
          tokenAddress,
          parseEther(minTokenAmount),
          BigInt(deadlineTimestamp),
        ],
        value: parseEther(bnbAmount),
        account: this.walletClient.account!,
      })

      return await this.walletClient.writeContract(request)
    } catch (error) {
      handleContractError(error)
      throw error
    }
  }

  /**
   * Sell tokens for BNB
   */
  async sellTokens(
    tokenAddress: Address,
    tokenAmount: string,
    minBNBAmount: string,
    deadline?: number
  ): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for selling tokens')
    }

    try {
      const deadlineTimestamp = deadline || Math.floor(Date.now() / 1000) + 300 // 5 minutes

      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'sell',
        args: [
          tokenAddress,
          parseEther(tokenAmount),
          parseEther(minBNBAmount),
          BigInt(deadlineTimestamp),
        ],
        account: this.walletClient.account!,
      })

      return await this.walletClient.writeContract(request)
    } catch (error) {
      handleContractError(error)
      throw error
    }
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Check if a token is tradeable
   */
  async isTokenTradeable(tokenAddress: Address): Promise<boolean> {
    try {
      const info = await this.getTokenInfo(tokenAddress)
      return info?.status === TokenStatus.TRADING
    } catch {
      return false
    }
  }

  /**
   * Get user's token balance tracked by the contract
   */
  async getUserTokenBalance(
    userAddress: Address,
    tokenAddress: Address
  ): Promise<bigint> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CoinRollCoreABI,
        functionName: 'userTokenBalance',
        args: [userAddress, tokenAddress],
      })

      return balance as bigint
    } catch (error) {
      console.error('Failed to get user token balance:', error)
      return BigInt(0)
    }
  }

  /**
   * Batch fetch token information for multiple tokens
   */
  async batchGetTokenInfo(
    tokenAddresses: Address[]
  ): Promise<(TokenInfo | null)[]> {
    try {
      const promises = tokenAddresses.map((addr) => this.getTokenInfo(addr))
      return await Promise.all(promises)
    } catch (error) {
      console.error('Failed to batch fetch token info:', error)
      return tokenAddresses.map(() => null)
    }
  }

  /**
   * Watch for token creation events
   */
  watchTokenCreations(
    onTokenCreated: (event: {
      token: Address
      creator: Address
      name: string
      symbol: string
    }) => void
  ) {
    return this.publicClient.watchContractEvent({
      address: this.contractAddress,
      abi: CoinRollCoreABI,
      eventName: 'TokenCreated',
      onLogs: (logs) => {
        logs.forEach((log: any) => {
          onTokenCreated({
            token: log.args.token,
            creator: log.args.creator,
            name: log.args.name,
            symbol: log.args.symbol,
          })
        })
      },
    })
  }
}
