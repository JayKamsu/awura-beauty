"use client";

import { useAuth } from "@/features/auth/context/auth-provider";
import { useCallback } from "react";

export function useAdminFetch() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useCallback(
    (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    },
    [token],
  );
}
