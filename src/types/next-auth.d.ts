import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "STAFF" | "LEAD" | "MANAGER";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: "STAFF" | "LEAD" | "MANAGER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role: "STAFF" | "LEAD" | "MANAGER";
  }
}
