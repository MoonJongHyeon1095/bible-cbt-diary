import { Capacitor } from "@capacitor/core";

export const getOAuthRedirectTo = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return Capacitor.isNativePlatform()
    ? "com.alliance617.emotionaldiary://auth-callback"
    : `${window.location.origin}/auth/callback`;
};
