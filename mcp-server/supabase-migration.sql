-- MCP Server API Keys Migration
-- Run this in Supabase SQL Editor to create the api_keys table

-- Create api_keys table for MCP authentication
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,              -- SHA-256 hash of the API key
  key_prefix TEXT NOT NULL,            -- First 8 chars for identification (e.g., "mcp_abc1")
  name TEXT NOT NULL DEFAULT 'Default', -- User-friendly name for the key
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  CONSTRAINT unique_key_hash UNIQUE (key_hash)
);

-- Index for fast key lookups
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- RLS Policy: Users can only see/manage their own API keys (via web app)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Note: The MCP server uses service_role key which bypasses RLS
-- This allows the server to lookup any user's API key by hash
