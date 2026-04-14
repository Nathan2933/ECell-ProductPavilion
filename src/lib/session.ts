import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  /** Set for ADMIN; STALL accounts may omit email (login by stall number). */
  email: string | null;
  role: "ADMIN" | "STALL";
  stallName: string | null;
  /** 1–30 for STALL; null for ADMIN */
  stallNumber: number | null;
};

export type AppSessionData = {
  user?: SessionUser;
};

function shouldUseSecureSessionCookie() {
  if (process.env.NODE_ENV === "production") return true;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  // ngrok / https tunnels in dev need Secure cookies so browsers accept the session on https://
  return base.startsWith("https://");
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "ecell_session",
  cookieOptions: {
    secure: shouldUseSecureSessionCookie(),
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<AppSessionData>(await cookies(), sessionOptions);
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}
