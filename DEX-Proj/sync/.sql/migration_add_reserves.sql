-- Migration: Add reserve0 and reserve1 columns to pools table
-- Date: 2025-12-24
-- Description: 添加 reserve0 和 reserve1 字段用于存储池子中 token0 和 token1 的余额

-- 添加 reserve0 字段
ALTER TABLE pools 
ADD COLUMN IF NOT EXISTS reserve0 NUMERIC DEFAULT 0;

-- 添加 reserve1 字段
ALTER TABLE pools 
ADD COLUMN IF NOT EXISTS reserve1 NUMERIC DEFAULT 0;

-- 添加注释
COMMENT ON COLUMN pools.reserve0 IS '池子中token0的余额（通过调用token0.balanceOf(pool)获取）';
COMMENT ON COLUMN pools.reserve1 IS '池子中token1的余额（通过调用token1.balanceOf(pool)获取）';

