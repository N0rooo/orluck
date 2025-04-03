import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define route categories
  const authRoutes = ['/login', '/signup'];
  const protectedRoutes = ['/account', '/leaderboard'];
  const protectedApiRoutes = ['/api/cashprize'];
  const currentPath = request.nextUrl.pathname;
  const isAdminRoute = currentPath.startsWith('/admin');
  const isAuthRoute = authRoutes.includes(currentPath);
  const isProtectedRoute = protectedRoutes.includes(currentPath);
  const isProtectedApiRoute = protectedApiRoutes.includes(currentPath);

  // If user is not authenticated
  if (!user) {
    // Allow only auth routes
    if (isAuthRoute) {
      return supabaseResponse;
    }

    // Return 401 for protected API routes
    if (isProtectedApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Redirect to login for protected routes or admin routes
    if (isProtectedRoute || isAdminRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow public routes
    return supabaseResponse;
  }

  // User is authenticated - check role
  const { data: roleData } = await supabase
    .from('user_role')
    .select('*')
    .eq('user_id', user.id)
    .single();
  const isAdmin = roleData?.role === 'admin';

  // If user is admin
  if (isAdmin) {
    // Redirect away from auth routes (login/signup)
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Allow all other routes for admins
    return supabaseResponse;
  }

  // User is authenticated but not admin
  // Redirect away from auth routes
  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Block admin routes for non-admin users
  if (isAdminRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow all other routes for authenticated non-admin users
  return supabaseResponse;
}
