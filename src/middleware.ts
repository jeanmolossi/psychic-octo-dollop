import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();

    const supabase = createMiddlewareClient({ req: request, res: response });

    const { data: { session } } = await supabase.auth.getSession();

    const { pathname, searchParams } = request.nextUrl;

    if (pathname.startsWith('/dashboard')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    const emailLinkError = 'Email link is invalid or has expired';

    if (
        (searchParams.get('error_description') === emailLinkError) &&
        pathname !== '/signup'
    ) {
        const url = new URL(
            `/signup?error_description=${searchParams.get('error_description')}`,
            request.url,
        )

        return NextResponse.redirect(url)
    }

    if (['/login', '/signup'].includes(pathname)) {
        if (session) {
            const url = new URL('/dashboard', request.url)
            return NextResponse.redirect(url)
        }
    }

    return response
}