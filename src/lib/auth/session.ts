import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const getAccessToken = (request: Request) => {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return null;
  }
  return authorization.slice(7);
};

export const getUserFromRequest = async (request: Request) => {
  const accessToken = getAccessToken(request);
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
