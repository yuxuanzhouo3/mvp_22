-- GitHub Integration Schema for Supabase
-- Run these SQL commands in your Supabase SQL Editor

-- Create table to store GitHub OAuth tokens
CREATE TABLE IF NOT EXISTS public.user_github_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_token TEXT NOT NULL,
  github_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_github_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for user_github_tokens table
-- Users can only view their own tokens
CREATE POLICY "Users can view their own GitHub tokens" ON public.user_github_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own GitHub tokens" ON public.user_github_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own GitHub tokens" ON public.user_github_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own GitHub tokens" ON public.user_github_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_github_tokens_user_id ON public.user_github_tokens(user_id);

































