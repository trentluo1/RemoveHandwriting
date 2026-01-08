-- ============================================================================
-- 快速修复失败的退款订单
-- 订单信息：
-- - Checkout Session: cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf
-- - 退款金额: 2780 分 ($27.80)
-- ============================================================================

-- 步骤 1: 查看订单当前状态
SELECT 
  id,
  "userId",
  amount,
  "refundStatus",
  "refundType",
  "refundedAmount",
  "orderType"
FROM "Order"
WHERE "stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf';

-- 步骤 2: 更新订单退款状态（如果 refundStatus 不是 'refunded'）
UPDATE "Order" 
SET 
  "refundStatus" = 'refunded',
  "refundType" = 'real',
  "refundedAmount" = 2780,
  "refundedAt" = NOW(),
  "refundReason" = 'Customer requested refund (manually fixed after webhook fix)'
WHERE "stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf'
  AND ("refundStatus" IS NULL OR "refundStatus" != 'refunded');

-- 步骤 3: 更新订阅状态（如果是首次订阅，需要取消订阅）
UPDATE "Subscription"
SET 
  status = 'canceled',
  "currentPeriodEnd" = NOW(),
  "updatedAt" = NOW()
WHERE "userId" = (
  SELECT "userId" 
  FROM "Order" 
  WHERE "stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf'
)
  AND status != 'canceled';

-- 步骤 4: 验证修复结果
SELECT 
  o.id as order_id,
  o."refundStatus",
  o."refundType",
  o."refundedAmount",
  o."refundedAt",
  s.status as subscription_status,
  s."currentPeriodEnd"
FROM "Order" o
LEFT JOIN "Subscription" s ON o."userId" = s."userId"
WHERE o."stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf';
