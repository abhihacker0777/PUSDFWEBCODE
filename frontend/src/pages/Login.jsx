import LoginBrandPanel from "./login/LoginBrandPanel";
import LoginForm from "./login/LoginForm";
import useLoginController from "./login/useLoginController";

export default function LoginPage() {
  const login = useLoginController();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <LoginBrandPanel />
      <LoginForm {...login} />
    </div>
  );
}
