#!/usr/bin/env node

/**
 * Supabase 连接测试脚本
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手动加载 .env.local 文件
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local 文件不存在');
      return {};
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    console.log('❌ 读取 .env.local 文件失败:', error.message);
    return {};
  }
}

const env = loadEnvFile();
process.env = { ...process.env, ...env };

async function testSupabaseConnection() {
  console.log('🔍 测试 Supabase 连接');
  console.log('========================\n');

  // 显示配置信息（隐藏敏感部分）
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('配置检查:');
  console.log(`- URL: ${url ? url.substring(0, 30) + '...' : '❌ 未设置'}`);
  console.log(`- Anon Key: ${anonKey ? anonKey.substring(0, 20) + '...' : '❌ 未设置'}`);
  console.log(`- Service Key: ${serviceKey ? '✅ 已设置' : '❌ 未设置'}\n`);

  if (!url || !anonKey) {
    console.log('❌ Supabase 配置不完整');
    console.log('请检查 .env.local 文件中的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }

  try {
    // 测试连接
    console.log('正在连接到 Supabase...');
    const supabase = createClient(url, anonKey);

    // 测试基本查询
    const { data, error } = await supabase.from('user_subscriptions').select('count').limit(1);

    if (error) {
      console.log('❌ 数据库查询失败:', error.message);

      if (error.message.includes('relation "public.user_subscriptions" does not exist')) {
        console.log('\n🔧 解决方案: 请在 Supabase SQL Editor 中运行 supabase-subscription-schema.sql');
      } else if (error.message.includes('JWT')) {
        console.log('\n🔧 解决方案: 请检查 Supabase anon key 是否正确');
      } else {
        console.log('\n🔧 请检查 Supabase 项目配置');
      }
    } else {
      console.log('✅ 数据库连接成功');
      console.log('✅ user_subscriptions 表存在');
    }

    // 测试认证
    console.log('\n测试认证状态...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('ℹ️  当前未登录用户（这是正常的）');
    } else {
      console.log('✅ 用户认证正常');
    }

  } catch (error) {
    console.log('❌ 连接测试失败:', error.message);

    if (error.message.includes('fetch')) {
      console.log('\n🔧 解决方案: 请检查 Supabase URL 是否正确');
    } else {
      console.log('\n🔧 请检查网络连接和配置');
    }
  }
}

testSupabaseConnection();
