/**
 * 订阅等级和模型权限配置
 */

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'premium';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  capabilities: string[];
}

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  models: string[]; // 允许使用的模型ID列表
  limits: {
    requestsPerDay: number;
    requestsPerMonth: number;
    maxTokensPerRequest: number;
  };
}

// 定义所有可用的模型
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  'deepseek-chat': {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    description: 'Fast and efficient conversational AI',
    maxTokens: 4096,
    contextWindow: 32768,
    capabilities: ['text-generation', 'code-generation']
  },
  'deepseek-coder': {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    description: 'Specialized for code generation and programming tasks',
    maxTokens: 4096,
    contextWindow: 32768,
    capabilities: ['code-generation', 'debugging', 'refactoring']
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Most capable GPT model for complex tasks',
    maxTokens: 8192,
    contextWindow: 8192,
    capabilities: ['text-generation', 'code-generation', 'analysis', 'creative-writing']
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Latest GPT-4 model with improved performance',
    maxTokens: 4096,
    contextWindow: 128000,
    capabilities: ['text-generation', 'code-generation', 'analysis', 'creative-writing', 'long-context']
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Most powerful Claude model for complex reasoning',
    maxTokens: 4096,
    contextWindow: 200000,
    capabilities: ['text-generation', 'code-generation', 'analysis', 'creative-writing', 'long-context']
  },
  'claude-3-sonnet': {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced model for most tasks',
    maxTokens: 4096,
    contextWindow: 200000,
    capabilities: ['text-generation', 'code-generation', 'analysis', 'creative-writing']
  }
};

// 定义订阅等级配置
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: '免费版',
    description: '基础功能，适合初次尝试',
    price: {
      monthly: 0,
      yearly: 0
    },
    features: [
      '基础代码生成',
      '有限请求次数',
      '标准支持'
    ],
    models: ['deepseek-chat'],
    limits: {
      requestsPerDay: 10,
      requestsPerMonth: 100,
      maxTokensPerRequest: 2048
    }
  },
  basic: {
    id: 'basic',
    name: '基础版',
    description: '增强功能，更好的AI模型',
    price: {
      monthly: 9.99,
      yearly: 99.99
    },
    features: [
      '增强代码生成',
      '更多请求次数',
      '优先支持',
      'DeepSeek Coder模型'
    ],
    models: ['deepseek-chat', 'deepseek-coder'],
    limits: {
      requestsPerDay: 50,
      requestsPerMonth: 1000,
      maxTokensPerRequest: 4096
    }
  },
  pro: {
    id: 'pro',
    name: '专业版',
    description: '专业级AI模型和功能',
    price: {
      monthly: 29.99,
      yearly: 299.99
    },
    features: [
      '专业级代码生成',
      '大量请求次数',
      '高级支持',
      'GPT-4模型',
      'Claude 3 Sonnet模型'
    ],
    models: ['deepseek-chat', 'deepseek-coder', 'gpt-4', 'claude-3-sonnet'],
    limits: {
      requestsPerDay: 200,
      requestsPerMonth: 5000,
      maxTokensPerRequest: 8192
    }
  },
  premium: {
    id: 'premium',
    name: '旗舰版',
    description: '最强大的AI模型和无限使用',
    price: {
      monthly: 99.99,
      yearly: 999.99
    },
    features: [
      '旗舰级代码生成',
      '无限请求次数',
      '专属支持',
      '所有高级模型',
      'GPT-4 Turbo',
      'Claude 3 Opus'
    ],
    models: ['deepseek-chat', 'deepseek-coder', 'gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet'],
    limits: {
      requestsPerDay: -1, // 无限制
      requestsPerMonth: -1, // 无限制
      maxTokensPerRequest: 32768
    }
  }
};

/**
 * 获取用户可用的模型列表
 */
export function getAvailableModelsForTier(tier: SubscriptionTier): ModelConfig[] {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  return tierConfig.models.map(modelId => AVAILABLE_MODELS[modelId]).filter(Boolean);
}

/**
 * 检查用户是否有权限使用指定的模型
 */
export function canUseModel(tier: SubscriptionTier, modelId: string): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  return tierConfig.models.includes(modelId);
}

/**
 * 获取用户当前等级的限制
 */
export function getTierLimits(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS[tier].limits;
}

/**
 * 获取默认模型（免费用户可用的第一个模型）
 */
export function getDefaultModel(tier: SubscriptionTier = 'free'): string {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  return tierConfig.models[0] || 'deepseek-chat';
}

/**
 * 获取下一个可升级的等级
 */
export function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['free', 'basic', 'pro', 'premium'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null;
  }
  return tiers[currentIndex + 1];
}
















