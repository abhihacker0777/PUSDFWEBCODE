import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/pulogo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (sessionStorage.getItem("token")) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("⚠️ To Login Enter Username And Password");
      return;
    }

    setIsLoading(true); // Start loading
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("token", data.token);
        navigate("/admin");
      } else {
        setError("❌ Invalid Username Or Password");
      }
    } catch (err) {
      console.error(err);
      setError("🛠️ Maintenance Mode. Try Again Later");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div
        className="w-full md:w-72 flex flex-col justify-between py-10 px-6 md:px-10"
        style={{ backgroundColor: "#264796" }}
      >
        <h1 className="text-2xl md:text-4xl font-extrabold leading-snug text-center md:text-left">
          <span className="text-white">Create, Update,<br />Manage<br /></span>
          <span style={{ color: "#e31d23" }}>&amp; Upload Your<br /></span>
          <span className="text-white">PYQP</span>
        </h1>

        <div className="flex flex-col items-center mt-6 md:mt-0">
          <img src={logo} alt="Poornima University Logo" className="w-52 h-auto object-contain" />
        </div>
        <div />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 md:px-0"
        style={{
          borderTopLeftRadius: "1.75rem",
          borderBottomLeftRadius: "1.75rem",
          backgroundColor: "#ffffff",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.04)",
        }}
      >
        <div className="w-full max-w-sm px-4 md:px-6 space-y-8">
          <h2 className="text-center text-4xl font-bold text-gray-900">Login</h2>
          
          {error && (
            <p className="text-red-500 text-sm text-center font-medium">{error}</p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-7"
          >
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              onFocus={() => setFocusedField("user")}
              onBlur={() => setFocusedField(null)}
              placeholder="Username"
              className={`w-full border-0 border-b pb-2 text-gray-600 placeholder-gray-400 text-sm bg-transparent outline-none transition-colors duration-300
                ${focusedField === "user" ? "border-[#ffc107]" : "border-[#05488b]"}`}
            />

            <div className="relative">       
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onFocus={() => setFocusedField("pass")}
                onBlur={() => setFocusedField(null)}
                placeholder="Password"
                className={`w-full border-0 border-b pb-2 text-gray-600 placeholder-gray-400 text-sm bg-transparent outline-none transition-colors duration-300
                  ${focusedField === "pass" ? "border-[#ffc107]" : "border-[#05488b]"}`}
              />

              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-gray-500 hover:text-black focus:outline-none"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-lg font-bold text-base tracking-wide transition-all duration-300 hover:opacity-90 shadow-md"
              style={{
                backgroundColor: focusedField ? "#ffc107" : "#05488b",
                color: "#ffffff",
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              {isLoading ? "Authenticating..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}