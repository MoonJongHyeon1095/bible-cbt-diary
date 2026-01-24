export const getOAuthRedirectTo = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.origin;
};
