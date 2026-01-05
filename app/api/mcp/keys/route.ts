import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// GET - Check if user has an existing API key
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for existing key
    const { data: existingKey, error } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, created_at, last_used_at, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Error fetching API key:', error);
      return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 });
    }

    return NextResponse.json({
      hasKey: !!existingKey,
      key: existingKey
        ? {
            id: existingKey.id,
            keyPrefix: existingKey.key_prefix,
            name: existingKey.name,
            createdAt: existingKey.created_at,
            lastUsedAt: existingKey.last_used_at,
          }
        : null,
    });
  } catch (error) {
    console.error('Error in GET /api/mcp/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Generate a new API key
export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for existing active key
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (existingKey) {
      return NextResponse.json(
        { error: 'You already have an active API key. Delete it first to generate a new one.' },
        { status: 400 }
      );
    }

    // Generate the API key
    const randomPart = crypto.randomBytes(24).toString('hex');
    const shortUserId = user.id.slice(0, 8);
    const rawKey = `mcp_${shortUserId}_${randomPart}`;

    // Hash for storage
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 16); // mcp_xxxxxxxx

    // Insert the new key
    const { data: newKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: 'MCP Integration',
      })
      .select('id, key_prefix, created_at')
      .single();

    if (insertError) {
      console.error('Error creating API key:', insertError);
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    // Return the raw key ONLY THIS ONCE
    return NextResponse.json({
      success: true,
      rawKey: rawKey, // Only shown once!
      key: {
        id: newKey.id,
        keyPrefix: newKey.key_prefix,
        createdAt: newKey.created_at,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/mcp/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete the user's API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    // Delete the key (verify ownership via user_id)
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting API key:', deleteError);
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/mcp/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
