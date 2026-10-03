import { useQuery } from "@tanstack/react-query";

import { ApiError, apiGet } from "@/lib/api";
import type { User } from "@/lib/types";

/** Who am I — the httpOnly session cookie rides the fetch automatically. */
export function useAuth() {
  const query = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await apiGet<User>("/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: Boolean(query.data),
  };
}
