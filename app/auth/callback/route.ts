import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const role = searchParams.get('role') as 'job_seeker' | 'recruiter' | null
  const type = searchParams.get('type') // 'signup' for email confirmation links

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error&error_code=no_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth exchange error:', error)
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_error&error_code=exchange_failed&error_description=${encodeURIComponent(error.message || 'Unknown error')}`
    )
  }

  // ── EMAIL CONFIRMATION LINK ──────────────────────────────────────────────
  // When the user clicks the "Confirm your email" link, Supabase sends
  // type=signup. We sign out the auto-created session so the user must
  // log in manually with their credentials.
  if (type === 'signup') {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?verified=true`)
  }

  // ── OAUTH (GOOGLE) ───────────────────────────────────────────────────────
  // Build / update profile and redirect to the appropriate dashboard.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Check if profile exists (should be created by DB trigger)
  const { data: existingProfile, error: profileFetchError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: UserRole } | null; error: { code?: string; message?: string } | null }

  if (profileFetchError && profileFetchError.code !== 'PGRST116') {
    console.error('Error fetching profile:', profileFetchError)
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_error&error_code=profile_fetch_failed`
    )
  }

  const userRole: UserRole = role || 'job_seeker'

  if (existingProfile) {
    // Update role if it differs and role was explicitly passed
    if (existingProfile.role !== userRole && role) {
      const { error: updateRoleError } = await supabase
        .from('profiles')
        .update({ role: userRole } as never)
        .eq('id', user.id)

      if (updateRoleError) {
        console.error('Role update error:', updateRoleError)
      }
    }

    // Ensure role-specific profile exists
    if (userRole === 'job_seeker') {
      const { data: seekerExists } = await supabase
        .from('seeker_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!seekerExists) {
        const { error: seekerError } = await supabase
          .from('seeker_profiles')
          .insert({ id: user.id, experience_summary: [], education_summary: [] } as never)

        if (seekerError && seekerError.code !== '23505') {
          console.error('Seeker profile creation error:', seekerError)
        }
      }
    } else if (userRole === 'recruiter') {
      const { data: recruiterExists } = await supabase
        .from('recruiter_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!recruiterExists) {
        const { error: recruiterError } = await supabase
          .from('recruiter_profiles')
          .insert({
            id: user.id,
            company_name: user.user_metadata?.company_name || 'My Company',
          } as never)

        if (recruiterError && recruiterError.code !== '23505') {
          console.error('Recruiter profile creation error:', recruiterError)
        }
      }
    }

    // Redirect based on the profile role
    let redirectPath = '/seeker/overview'
    switch (existingProfile.role) {
      case 'admin':
        redirectPath = '/admin/login'
        break
      case 'recruiter':
        redirectPath = '/recruiter/overview'
        break
      case 'job_seeker':
      default:
        redirectPath = '/seeker/overview'
        break
    }
    return NextResponse.redirect(`${origin}${redirectPath}`)
  }

  // Profile doesn't exist — create it manually (fallback if trigger didn't fire)
  console.warn('Profile not created by trigger, creating manually')

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'
  const avatarUrl = user.user_metadata?.avatar_url || null

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email!,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: userRole,
    } as never)

  if (profileError) {
    console.error('Profile creation error:', profileError)
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_error&error_code=profile_creation_failed&error_description=${encodeURIComponent(profileError.message)}`
    )
  }

  // Create role-specific profile
  if (userRole === 'job_seeker') {
    const { error: seekerError } = await supabase
      .from('seeker_profiles')
      .insert({ id: user.id, experience_summary: [], education_summary: [] } as never)

    if (seekerError) console.error('Seeker profile creation error:', seekerError)
  } else if (userRole === 'recruiter') {
    const { error: recruiterError } = await supabase
      .from('recruiter_profiles')
      .insert({
        id: user.id,
        company_name: user.user_metadata?.company_name || 'My Company',
      } as never)

    if (recruiterError) console.error('Recruiter profile creation error:', recruiterError)
  }

  const redirectPath = userRole === 'recruiter' ? '/recruiter/overview' : '/seeker/overview'
  return NextResponse.redirect(`${origin}${redirectPath}`)
}
