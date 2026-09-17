import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { findEditor } from "./editors.ts";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Discord({
      clientId: required("DISCORD_CLIENT_ID"),
      clientSecret: required("DISCORD_CLIENT_SECRET"),
      authorization: { params: { scope: "identify" } },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.id) return false;
      return (await findEditor(String(profile.id))) ? true : "/forbidden";
    },
    jwt({ token, profile }) {
      if (profile?.id) token.discordId = String(profile.id);
      return token;
    },
    session({ session, token }) {
      session.user.discordId = String(token.discordId ?? "");
      return session;
    },
  },
});
