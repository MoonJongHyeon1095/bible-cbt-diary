import { createSupabaseAdminClient } from "../supabase/adminNode";

const normalizeAuthHeader = (
  authorization?: string | string[] | null,
) => {
  if (Array.isArray(authorization)) {
    return authorization[0] ?? "";
  }
  return authorization ?? "";
};

const getAccessToken = (authorization?: string | string[] | null) => {
  const normalized = normalizeAuthHeader(authorization);
  if (!normalized.startsWith("Bearer ")) {
    return null;
  }
  return normalized.slice(7);
};

export const getUserFromAuthHeader = async (
  authorization?: string | string[] | null,
) => {
  const accessToken = getAccessToken(authorization);
  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error) {
    return null;
  }

  return data.user;
};
