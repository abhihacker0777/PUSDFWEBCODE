"use client";

import { useEffect } from "react";
import { buildBackendUrl, getCsrfToken } from "@/services/api";

export default function useLoginSessionCheck(onAuthenticated: () => void) {
  useEffect(() => {
    getCsrfToken().catch(() => {});
    fetch(buildBackendUrl("/me"), {
      method: "GET",
      credentials: "include",
      redirect: "error"
    })
      .then((res) => {
        if (res.ok) onAuthenticated();
      })
      .catch(() => {});
  }, [onAuthenticated]);
}
