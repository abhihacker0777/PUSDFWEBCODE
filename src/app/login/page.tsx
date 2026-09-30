"use client";

import React from "react";
import LoginBrandPanel from "./components/LoginBrandPanel";
import LoginForm from "./components/LoginForm";
import useLoginController from "./components/useLoginController";

export default function LoginPage() {
  const login = useLoginController();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <LoginBrandPanel />
      <LoginForm {...login} />
    </div>
  );
}
