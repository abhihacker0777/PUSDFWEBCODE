"use client";

import { useEffect } from "react";
import { BACKEND_URL, getCsrfToken } from "@/services/api";

export default function useLoginSessionCheck(onAuthenticated: () => void) {
  useEffect(() => {
    getCsrfToken().catch(() => {});
    fetch(`${BACKEND_URL}/me`, {
      method: "GET",
      credentials: "include"
    })
      .then((res) => {
        if (res.ok) onAuthenticated();
      })
      .catch(() => {});
  }, [onAuthenticated]);
}
