export const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE ?? "";

export const buildApiUrl = (path: string) => {
  if (!path) {
    return getApiBase();
  }
  if (path.startsWith("/")) {
    return `${getApiBase()}${path}`;
  }
  return `${getApiBase()}/${path}`;
};
