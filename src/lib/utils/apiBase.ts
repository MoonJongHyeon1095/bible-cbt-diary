export const getApiBase = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "";
    }
  }
  return process.env.NEXT_PUBLIC_API_BASE ?? "";
};

export const buildApiUrl = (path: string) => {
  if (!path) {
    return getApiBase();
  }
  if (path.startsWith("/")) {
    return `${getApiBase()}${path}`;
  }
  return `${getApiBase()}/${path}`;
};
