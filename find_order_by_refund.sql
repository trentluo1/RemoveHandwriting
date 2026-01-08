-- ============================================================================
-- 查找退款对应的订单 - 根据 Stripe 页面详细信息
-- Charge ID: ch_3SLdWIHEruuV5CvF1Ekj8bPC
-- Payment Intent: pi_3SLdWIHEruuV5CvF1vs1b8xU
-- 退款金额: 2780 分 ($27.80)
-- 
-- 从 Stripe 页面获取的详细信息：
-- Customer ID: cus_TIDyHolVhQ1501
-- Customer Email: kontakt@schauertegmbh.de
-- Subscription ID: sub_1SLdWKHEruuV5CvF70FmZNrc
-- Price ID: price_1SHKFFHEruuV5CvFCetrtCPO
-- 订单类型: 首次订阅 (Subscription creation)
-- 创建时间: 2025-10-24 05:26 (UTC+8, 即 2025-10-23 21:26 UTC)
-- 退款时间: 2026-01-08 07:37 (UTC+8, 即 2026-01-08 23:37 UTC)
-- ============================================================================

-- ============================================================================
-- 方法 1: 通过 Customer ID 查找（最精确的方法）
-- 先找到 Subscription，然后通过 userId 查找订单
-- ============================================================================
SELECT 
  o.id as order_id,
  o."userId",
  o.amount,
  o.currency,
  o."stripeSessionId",
  o."orderType",
  o.status,
  o."refundStatus",
  o."billingEmail",
  o."createdAt",
  s."stripeCustomerId",
  s."priceId",
  CASE 
    WHEN o."stripeSessionId" LIKE 'cs_%' THEN 'Checkout Session'
    WHEN o."stripeSessionId" LIKE 'in_%' THEN 'Invoice'
    WHEN o."stripeSessionId" LIKE 'pi_%' THEN 'Payment Intent'
    WHEN o."stripeSessionId" LIKE 'I-%' THEN 'PayPal Invoice'
    ELSE 'Other'
  END as session_type
FROM "Order" o
JOIN "Subscription" s ON o."userId" = s."userId"
WHERE s."stripeCustomerId" = 'cus_TIDyHolVhQ1501'
  AND o.amount = 2780
  AND o."orderType" = 'subscription'
ORDER BY o."createdAt" DESC;

-- ============================================================================
-- 方法 2: 通过 billingEmail 查找（精确匹配邮箱）
-- ============================================================================
SELECT 
  id,
  "userId",
  amount,
  currency,
  "stripeSessionId",
  "orderType",
  status,
  "refundStatus",
  "billingEmail",
  "createdAt",
  CASE 
    WHEN "stripeSessionId" LIKE 'cs_%' THEN 'Checkout Session'
    WHEN "stripeSessionId" LIKE 'in_%' THEN 'Invoice'
    WHEN "stripeSessionId" LIKE 'pi_%' THEN 'Payment Intent'
    WHEN "stripeSessionId" LIKE 'I-%' THEN 'PayPal Invoice'
    ELSE 'Other'
  END as session_type
FROM "Order"
WHERE "billingEmail" = 'kontakt@schauertegmbh.de'
  AND amount = 2780
ORDER BY "createdAt" DESC;

-- ============================================================================
-- 方法 3: 根据金额和精确时间范围查找
-- 创建时间: 2025-10-24 05:26 (UTC+8) = 2025-10-23 21:26 UTC
-- 查找 2025-10-23 到 2025-10-25 之间的订单
-- ============================================================================
SELECT 
  id,
  "userId",
  amount,
  currency,
  "stripeSessionId",
  "orderType",
  status,
  "refundStatus",
  "billingEmail",
  "createdAt",
  CASE 
    WHEN "stripeSessionId" LIKE 'cs_%' THEN 'Checkout Session'
    WHEN "stripeSessionId" LIKE 'in_%' THEN 'Invoice'
    WHEN "stripeSessionId" LIKE 'pi_%' THEN 'Payment Intent'
    WHEN "stripeSessionId" LIKE 'I-%' THEN 'PayPal Invoice'
    ELSE 'Other'
  END as session_type
FROM "Order"
WHERE amount = 2780
  AND "createdAt" >= '2025-10-23 00:00:00'::timestamp
  AND "createdAt" <= '2025-10-25 23:59:59'::timestamp
ORDER BY "createdAt" DESC;

-- ============================================================================
-- 方法 4: 综合查询 - 结合 Customer ID、金额、邮箱和时间范围
-- 这是最全面的查询，应该能找到订单
-- ============================================================================
SELECT 
  o.id as order_id,
  o."userId",
  o.amount,
  o.currency,
  o."stripeSessionId",
  o."orderType",
  o.status,
  o."refundStatus",
  o."billingEmail",
  o."createdAt",
  s."stripeCustomerId",
  s."priceId",
  s.status as subscription_status,
  up.email as user_email,
  CASE 
    WHEN o."stripeSessionId" LIKE 'cs_%' THEN 'Checkout Session'
    WHEN o."stripeSessionId" LIKE 'in_%' THEN 'Invoice'
    WHEN o."stripeSessionId" LIKE 'pi_%' THEN 'Payment Intent'
    WHEN o."stripeSessionId" LIKE 'I-%' THEN 'PayPal Invoice'
    ELSE 'Other'
  END as session_type
FROM "Order" o
LEFT JOIN "Subscription" s ON o."userId" = s."userId"
LEFT JOIN "UserProfile" up ON o."userId" = up."userId"
WHERE (
  (s."stripeCustomerId" = 'cus_TIDyHolVhQ1501')
  OR (o."billingEmail" = 'kontakt@schauertegmbh.de')
)
  AND o.amount = 2780
  AND o."createdAt" >= '2025-10-23 00:00:00'::timestamp
  AND o."createdAt" <= '2025-10-25 23:59:59'::timestamp
ORDER BY o."createdAt" DESC;

-- ============================================================================
-- 方法 5: 查找该客户的所有订单（用于排查是否有其他相关订单）
-- ============================================================================
SELECT 
  o.id as order_id,
  o."userId",
  o.amount,
  o.currency,
  o."stripeSessionId",
  o."orderType",
  o.status,
  o."refundStatus",
  o."billingEmail",
  o."createdAt",
  s."stripeCustomerId",
  CASE 
    WHEN o."stripeSessionId" LIKE 'cs_%' THEN 'Checkout Session'
    WHEN o."stripeSessionId" LIKE 'in_%' THEN 'Invoice'
    WHEN o."stripeSessionId" LIKE 'pi_%' THEN 'Payment Intent'
    WHEN o."stripeSessionId" LIKE 'I-%' THEN 'PayPal Invoice'
    ELSE 'Other'
  END as session_type
FROM "Order" o
LEFT JOIN "Subscription" s ON o."userId" = s."userId"
WHERE s."stripeCustomerId" = 'cus_TIDyHolVhQ1501'
   OR o."billingEmail" = 'kontakt@schauertegmbh.de'
ORDER BY o."createdAt" DESC;

-- ============================================================================
-- 方法 6: 验证 Subscription 记录是否存在
-- ============================================================================
SELECT 
  id,
  "userId",
  "stripeCustomerId",
  status,
  "priceId",
  "billingEmail",
  "paymentProvider",
  "createdAt"
FROM "Subscription"
WHERE "stripeCustomerId" = 'cus_TIDyHolVhQ1501';

-- ============================================================================
-- 方法 7: 查找所有金额为 2780 的订单（用于排查是否有重复订单）
-- ============================================================================
SELECT 
  id,
  "userId",
  amount,
  currency,
  "stripeSessionId",
  "orderType",
  status,
  "refundStatus",
  "billingEmail",
  "createdAt",
  CASE 
    WHEN "stripeSessionId" LIKE 'cs_%' THEN 'Checkout Session'
    WHEN "stripeSessionId" LIKE 'in_%' THEN 'Invoice'
    WHEN "stripeSessionId" LIKE 'pi_%' THEN 'Payment Intent'
    WHEN "stripeSessionId" LIKE 'I-%' THEN 'PayPal Invoice'
    ELSE 'Other'
  END as session_type
FROM "Order"
WHERE amount = 2780
ORDER BY "createdAt" DESC;

-- ============================================================================
-- 错误原因分析
-- ============================================================================
-- 
-- 根据代码分析，webhook 处理 charge.refunded 事件的逻辑如下：
-- 
-- 1. 首先尝试通过 payment_intent 查找订单：
--    SELECT ... FROM "Order" WHERE "stripeSessionId" = payment_intent
--    ❌ 问题：Order 表的 stripeSessionId 存储的是 checkout session ID (cs_xxx)
--       或 invoice ID (in_xxx)，而不是 payment_intent ID (pi_xxx)
--
-- 2. 如果没找到，尝试通过 invoice 查找：
--    SELECT ... FROM "Order" WHERE "stripeSessionId" = invoice_id
--    ✅ 这个逻辑是对的，但前提是 charge.invoice 存在
--
-- 3. 对于首次订阅订单（如本例）：
--    - 订单的 stripeSessionId 存储的是 checkout session ID (cs_xxx)
--    - charge.refunded 事件中的 charge 对象可能没有 invoice 字段
--      （因为首次订阅的 charge 可能不直接关联 invoice）
--    - 所以两个查找都失败了
--
-- 解决方案：
-- 需要通过 payment_intent 找到对应的 checkout session，然后用 session.id 查找订单
-- 
-- Stripe API 查询步骤：
-- 1. stripe payment_intents retrieve pi_3SLdWIHEruuV5CvF1vs1b8xU
-- 2. 查看返回的 metadata 中是否有 checkout_session_id
-- 3. 或者使用：stripe checkout.sessions.list --payment_intent=pi_3SLdWIHEruuV5CvF1vs1b8xU
-- 4. 然后用找到的 checkout session ID 在数据库中查找订单
--
-- ============================================================================
-- 验证查询：检查是否有订单的 stripeSessionId 格式异常
-- ============================================================================
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN "stripeSessionId" LIKE 'cs_%' THEN 1 END) as checkout_sessions,
  COUNT(CASE WHEN "stripeSessionId" LIKE 'in_%' THEN 1 END) as invoices,
  COUNT(CASE WHEN "stripeSessionId" LIKE 'pi_%' THEN 1 END) as payment_intents,
  COUNT(CASE WHEN "stripeSessionId" IS NULL THEN 1 END) as null_sessions
FROM "Order"
WHERE "orderType" = 'subscription';
-- ============================================================================
