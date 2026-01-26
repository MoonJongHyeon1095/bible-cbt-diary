export type AccessMode = "auth" | "guest" | "blocked";

export type AccessContext = {
  mode: AccessMode;
  accessToken: string | null;
  userEmail?: string | null;
};
