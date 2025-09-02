import { clerkClient, clerkMiddleware, createRouteMatcher, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

const isProtectedRoute = createRouteMatcher(['/(api|trpc)(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    if (req.method === 'OPTIONS') {
      return NextResponse.next()
    }
    const { userId, getToken, has, sessionId } = await auth()
    const token = await getToken()
    // await auth.protect()
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // const clerk = await clerkClient()
    // const user = await currentUser()
    // console.log('user:', user)
    // const session = await clerk.sessions.getSession(sessionId)
    // const token2 = req.headers.get('Authorization')?.replace('Bearer ', '')
    // const reqState = await clerk.authenticateRequest(req)
    // console.log('reqState:', reqState)
    // auth.protect()
  }
}, {
  debug: true
});