-- =====================================================
-- 支付系统数据库 Schema
-- 用于存储支付记录和订阅信息
-- =====================================================

-- 1. 先创建 subscriptions 表（订阅信息）
-- 注意：必须先创建 subscriptions，因为 payments 表会引用它
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id VARCHAR(50) NOT NULL DEFAULT 'pro', -- pro, team, etc.
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired
  provider_subscription_id VARCHAR(255), -- 支付提供商的订阅ID
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 payments 表（支付记录）
-- 注意：必须在 subscriptions 表创建之后，因为它引用了 subscriptions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method VARCHAR(20) NOT NULL, -- stripe, paypal, alipay, wechat
  transaction_id VARCHAR(255) NOT NULL, -- 支付提供商的交易ID
  metadata JSONB, -- 存储额外信息，如天数、账单周期等
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 webhook_events 表（webhook 事件记录，用于幂等性）
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id VARCHAR(255) PRIMARY KEY, -- provider_eventId 格式
  provider VARCHAR(20) NOT NULL, -- paypal, stripe, alipay, wechat
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);

-- 5. 启用行级安全策略
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略
-- payments 表：用户只能查看自己的支付记录
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- subscriptions 表：用户只能查看自己的订阅
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- webhook_events 表：只有服务端可以访问
CREATE POLICY "Webhook events are server-only" ON public.webhook_events
  FOR ALL USING (false); -- 禁止所有客户端访问

-- 7. 创建更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 为 payments 和 subscriptions 表添加触发器
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

