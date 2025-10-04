export const security = {
  cookie: (isProd: boolean, domain?: string) => ({
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : ("lax" as const),
    domain,
  }),
  helmet: {
    contentSecurityPolicy: false, // включай, если нет inline-скриптов
    crossOriginResourcePolicy: { policy: "same-site" },
  },
};
