// Next.js 16: renamed from middleware.ts to proxy.ts
// Note: next-auth/middleware uses the NextAuth default export which is compatible
// with the proxy convention via default export.
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/settings/:path*"],
};
