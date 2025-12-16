// 首先加载环境变量
import dotenv from 'dotenv';
import path from 'path';

// 加载 .env.local 文件
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// 备选：如果没有 .env.local，尝试加载 .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { initializeDatabase } from '../lib/database';
import { scanner } from '../lib/blockchain-scanner';

async function main() {
  console.log('正在启动区块链扫描器...');
  
  // 显示当前环境变量配置（用于调试）
  console.log('数据库配置:', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'dex_scanner'
  });
  
  console.log('RPC URL:', process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org');
  
  try {
    // 初始化数据库
    console.log('初始化数据库...');
    await initializeDatabase();
    
    // 启动扫描器
    console.log('启动扫描器...');
    await scanner.start();
    
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭扫描器...');
  scanner.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭扫描器...');
  scanner.stop();
  process.exit(0);
});

// 启动
main().catch(console.error); 