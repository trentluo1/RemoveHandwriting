-- ============================================================================
-- 修复失败的退款订单
-- Charge ID: ch_3SLdWIHEruuV5CvF1Ekj8bPC
-- Payment Intent: pi_3SLdWIHEruuV5CvF1vs1b8xU
-- Checkout Session ID: cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf
-- 退款金额: 2780 分 ($27.80)
-- Customer ID: cus_TIDyHolVhQ1501
-- Customer Email: kontakt@schauertegmbh.de
-- ============================================================================

-- 步骤 1: 查找订单
SELECT 
  id,
  "userId",
  amount,
  currency,
  "stripeSessionId",
  "orderType",
  status,
  "refundStatus",
  "refundType",
  "refundedAmount",
  "refundedAt",
  "billingEmail",
  "createdAt"
FROM "Order"
WHERE "stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf';

-- 步骤 2: 检查订单当前状态（执行步骤1后，确认订单信息）
-- 如果 refundStatus 不是 'refunded'，执行步骤 3

-- 步骤 3: 更新订单退款状态
-- ⚠️ 注意：执行前请确认订单信息正确
UPDATE "Order" 
SET 
  "refundStatus" = 'refunded',
  "refundType" = 'real',
  "refundedAmount" = 2780,
  "refundedAt" = NOW(),
  "refundReason" = 'Customer requested refund (manually fixed after webhook fix)'
WHERE "stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf'
  AND ("refundStatus" IS NULL OR "refundStatus" != 'refunded');

-- 步骤 4: 验证更新结果
SELECT 
  id,
  "userId",
  amount,
  "refundStatus",
  "refundType",
  "refundedAmount",
  "refundedAt",
  "refundReason"
FROM "Order"
WHERE "stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf';

-- ============================================================================
-- 步骤 5: 处理订阅取消（如果需要）
-- 根据订单的 userId 查找订阅并更新状态
-- ============================================================================

-- 5.1 查找订单对应的订阅
SELECT 
  o.id as order_id,
  o."userId",
  o."orderType",
  s.id as subscription_id,
  s.status as subscription_status,
  s."stripeCustomerId",
  s."currentPeriodEnd"
FROM "Order" o
LEFT JOIN "Subscription" s ON o."userId" = s."userId"
WHERE o."stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf';

-- 5.2 如果订阅存在且状态不是 'canceled'，更新订阅状态
-- ⚠️ 注意：根据业务逻辑，首次订阅退款应该取消订阅
-- 执行前请确认是否需要取消订阅
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

-- 5.3 验证订阅更新结果
SELECT 
  id,
  "userId",
  status,
  "currentPeriodEnd",
  "updatedAt"
FROM "Subscription"
WHERE "userId" = (
  SELECT "userId" 
  FROM "Order" 
  WHERE "stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf'
);

-- ============================================================================
-- 完整修复脚本（一次性执行所有步骤）
-- ⚠️ 警告：执行前请先运行步骤1和步骤5.1确认数据
-- ============================================================================

-- 开始事务
BEGIN;

-- 更新订单退款状态
UPDATE "Order" 
SET 
  "refundStatus" = 'refunded',
  "refundType" = 'real',
  "refundedAmount" = 2780,
  "refundedAt" = NOW(),
  "refundReason" = 'Customer requested refund (manually fixed after webhook fix)'
WHERE "stripeSessionId" = 'cs_live_a1iTZaKXJMyTQkIuw5LVhKeLYNgjunOWrIeK8aHuFUhhdY1ASduv6yNtxf'
  AND ("refundStatus" IS NULL OR "refundStatus" != 'refunded');

-- 更新订阅状态（如果需要）
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

-- 提交事务（如果确认无误）
-- COMMIT;

-- 如果发现问题，可以回滚
-- ROLLBACK;

-- ============================================================================
-- 使用说明
-- ============================================================================
-- 
-- 1. 先执行步骤1，确认订单信息
-- 2. 执行步骤5.1，确认订阅信息
-- 3. 如果订单的 refundStatus 已经是 'refunded'，说明可能已经处理过了
-- 4. 如果确认需要修复，执行步骤3和步骤5.2
-- 5. 或者使用完整修复脚本（在事务中执行，可以回滚）
--
-- 注意事项：
-- - 首次订阅退款通常需要取消订阅
-- - 如果订阅已经取消，步骤5.2不会重复更新
-- - 建议在测试环境先验证SQL语句
-- ============================================================================
