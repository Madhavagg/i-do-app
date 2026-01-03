import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()

    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        // If it's a password recovery, redirect to reset password page
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/auth/reset-password`)
        }
        // Otherwise, redirect to the next page (usually home)
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return to login with error if something went wrong
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
