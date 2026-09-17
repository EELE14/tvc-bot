import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      discordId: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
  }
}
