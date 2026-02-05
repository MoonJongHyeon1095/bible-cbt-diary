export const getApiBase = () => {
  //return process.env.NEXT_PUBLIC_API_BASE ?? "";
  return "http://localhost:3000";
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
