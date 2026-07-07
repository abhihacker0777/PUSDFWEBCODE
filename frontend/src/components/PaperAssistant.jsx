import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiExternalLink,
  FiRefreshCw,
  FiX,
  FiMessageCircle
} from "react-icons/fi";
import {
  askPaperAssistant,
  fetchAssistantConfig,
  verifyAssistantGoogleCredential
} from "../services/api";

// --- LOGO IMPORTS ---
import puLogo from "../assets/logo.png";
import sarvamLogoSvg from "../assets/pusarvamlogo.svg"; 
import sarvamLogoJpg from "../assets/pusarvamailogo.jpg"; 

const AUTH_STORAGE_KEY = "puAssistantGoogleAuth";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DEFAULT_DOMAIN = "poornima.edu.in";

let googleScriptPromise = null;

const getSafeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      ["drive.google.com", "docs.google.com"].includes(parsed.hostname.toLowerCase())
    ) ? parsed.href : null;
  } catch {
    return null;
  }
};

const readJwtPayload = (credential) => {
  try {
    const payload = String(credential || "").split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

const getStoredAuth = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY) || "null");
    const payload = readJwtPayload(saved?.credential);
    if (!payload?.exp || payload.exp * 1000 <= Date.now() + 60 * 1000) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

const buildInitialMessages = (user) => ([
  {
    role: "bot",
    text: user?.email
      ? "Welcome back. Which paper do you need?"
      : "Sign in with your Poornima Google account to ask for papers.",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
]);

// 🔥 ADDED "BLOCKED_USER" TO THIS LIST SO IT DESTROYS THE SESSION
const isAuthError = (code) => [
  "SIGN_IN_REQUIRED",
  "INVALID_GOOGLE_ACCOUNT",
  "INVALID_EMAIL_DOMAIN",
  "INVALID_GOOGLE_TOKEN",
  "BLOCKED_USER"
].includes(code);

export default function PaperAssistant() {
  const savedAuth = getStoredAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState(savedAuth ? "chat" : "signin");
  const [auth, setAuth] = useState(savedAuth);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => buildInitialMessages(savedAuth?.user));
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [config, setConfig] = useState({
    googleClientId: "",
    emailDomain: DEFAULT_DOMAIN,
    aiProvider: "sarvam",
    sarvamEnabled: false
  });
  const googleButtonRef = useRef(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchAssistantConfig()
      .then((data) => {
        if (!active) return;
        setConfig({
          googleClientId: data.googleClientId || "",
          emailDomain: data.emailDomain || DEFAULT_DOMAIN,
          aiProvider: data.aiProvider || "sarvam",
          sarvamEnabled: Boolean(data.sarvamEnabled)
        });
      })
      .catch(() => {
        if (!active) return;
        setSignInError("Assistant sign-in is not configured yet.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const pushMessage = (message) => {
    setMessages((current) => [
      ...current,
      {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...message
      }
    ]);
  };

  const clearAuth = useCallback(() => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.google?.accounts?.id?.disableAutoSelect?.();
    setAuth(null);
    setInput("");
    setMessages(buildInitialMessages(null));
    setView("signin");
  }, []);

  const handleGoogleCredential = useCallback(async (response) => {
    const credential = response?.credential || "";
    if (!credential) {
      setSignInError("Google sign-in did not complete. Please try again.");
      return;
    }

    setIsSigningIn(true);
    setSignInError("");

    try {
      const verified = await verifyAssistantGoogleCredential(credential);
      const nextAuth = {
        credential,
        user: verified.user,
        savedAt: Date.now()
      };
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
      setAuth(nextAuth);
      setMessages(buildInitialMessages(verified.user));
      setView("chat");
    } catch (error) {
      setSignInError(error.message || `Please Sign In With Your ${config.emailDomain} Google Account.`);
    } finally {
      setIsSigningIn(false);
    }
  }, [config.emailDomain]);

  useEffect(() => {
    if (!isOpen || view !== "signin" || !config.googleClientId || !googleButtonRef.current) return undefined;

    let disposed = false;
    googleButtonRef.current.innerHTML = "";

    loadGoogleScript()
      .then(() => {
        if (disposed || !googleButtonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: handleGoogleCredential,
          ux_mode: "popup"
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          logo_alignment: "left",
          width: 320
        });
      })
      .catch(() => {
        if (!disposed) setSignInError("Google sign-in could not load. Check internet or ad blocker.");
      });

    return () => {
      disposed = true;
    };
  }, [config.googleClientId, handleGoogleCredential, isOpen, view]);

  const openAssistant = () => {
    setIsOpen(true);
    setSignInError("");
  };

  const closeAssistant = () => {
    setIsOpen(false);
    setInput("");
    setSignInError("");
    setMessages(buildInitialMessages(auth?.user));
    setView(auth ? "chat" : "signin");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || isLoading) return;

    if (!auth?.credential) {
      setView("signin");
      setSignInError(`Please Sign In With Your ${config.emailDomain} Google Account First.`);
      return;
    }

    if (!getStoredAuth()) {
      clearAuth();
      setSignInError("Your Google Sign-In Expired. Please Sign In Again.");
      return;
    }

    pushMessage({ role: "user", text: value });
    setInput("");
    setIsLoading(true);

    try {
      const answer = await askPaperAssistant({ credential: auth.credential, question: value });
      pushMessage({
        role: "bot",
        text: answer.message,
        results: Array.isArray(answer.results) ? answer.results : [],
        status: answer.status
      });
    } catch (error) {
      if (isAuthError(error.code)) {
        clearAuth();
        setSignInError(error.message || "Please sign in again.");
        return;
      }

      pushMessage({
        role: "bot",
        text: error.message || "Assistant is not available right now. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPoweredFooter = () => (
    <div className="pu-assistant-powered flex items-center justify-center gap-1 pb-2">
      Powered By 
      <a href="https://www.sarvam.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
        <img src={sarvamLogoSvg} alt="Sarvam AI" className="h-3 inline-block ml-1 opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />
      </a>
    </div>
  );

  const renderSignin = () => (
    <div className="pu-assistant-pattern pu-assistant-choice-bg">
      <div className="pu-assistant-choice-shell text-center">
        <div className="pu-assistant-choice-title">
          <h3>Verify Your Poornima Email</h3>
        </div>
        <p className="mx-auto mt-2 max-w-[340px] text-sm leading-relaxed text-[#ffffff]">
          Sign In With Google Using Your {config.emailDomain} Account To Use This Assistant.
        </p>

        <div className="mx-auto mt-8 w-full max-w-[360px] rounded-[18px]">
          {config.googleClientId ? (
            <div className="flex justify-center" ref={googleButtonRef} />
          ) : (
            <p className="text-sm font-semibold text-red-600">Google Sign-In Client ID Is Missing.</p>
          )}
          {isSigningIn && <p className="mt-4 text-sm font-semibold text-[#05488B]">Verifying Google Account...</p>}
          {signInError && <p className="mt-4 text-sm font-semibold text-red-600">{signInError}</p>}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <>
      <div ref={messagesRef} className="pu-assistant-pattern pu-assistant-chat-area">
        <div className="pu-assistant-message-stack">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`pu-assistant-message-row ${message.role === "user" ? "is-user" : "is-bot"}`}
            >
              {message.role !== "user" && (
                <img src={puLogo} alt="" className="pu-assistant-message-avatar" />
              )}
              <div className="pu-assistant-message-body">
                <div className="pu-assistant-message-content">
                  <p className="font-bold">{message.text}</p>

                  {message.results?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.results.map((paper, resultIndex) => {
                        const safeLink = getSafeUrl(paper.link);
                        return (
                          <a
                            key={`${paper.name}-${resultIndex}`}
                            href={safeLink || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex flex-col rounded-[20px] bg-[#4a479c] border border-[#5c59ba] px-4 py-2 text-white shadow-sm transition-colors ${
                              safeLink ? "hover:bg-[#3d3a85]" : "pointer-events-none opacity-60"
                            }`}
                          >
                            <span className="flex flex-col gap-0.5 items-start text-left">
                              <span className="flex items-center gap-2 font-medium text-[13px]">
                                {paper.name}
                                {safeLink && <FiExternalLink className="shrink-0 opacity-80" aria-hidden="true" />}
                              </span>
                              <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">
                                {paper.specialization ? `${paper.specialization} • ` : ""}{paper.sem} • {paper.exam}
                              </span>
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="pu-assistant-message-time">{message.time}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="pu-assistant-message-row is-bot">
              <img src={puLogo} alt="" className="pu-assistant-message-avatar" />
              <div className="pu-assistant-message-body">
                <div className="pu-assistant-typing-bubble" aria-label="Loading">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pu-assistant-input-bar">
        <div className="pu-assistant-input-wrap">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your message..."
            className="pu-assistant-input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="pu-assistant-send"
            aria-label="Send"
          >
            <svg className="pu-assistant-send-gradient-defs" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="pu-assistant-send-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#998115" />
                  <stop offset="100%" stopColor="#89b45d" />
                </linearGradient>
              </defs>
            </svg>
            <svg className="pu-assistant-send-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3.5 4.5L21 12L3.5 19.5V14.1L14.2 12L3.5 9.9V4.5Z" />
            </svg>
          </button>
        </div>
      </form>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={openAssistant}
        className={`pu-assistant-launcher fixed bottom-5 right-5 z-40 flex flex-col items-center gap-2 ${isOpen ? "hidden" : ""}`}
        aria-label="Open PU Assistant"
      >
        <span className="pu-assistant-float relative flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-slate-900/10">
          <img src={sarvamLogoJpg} alt="Assistant" className="h-full w-full rounded-full object-cover" />
        </span>
        
        <span className="pu-assistant-launcher-label rounded-full bg-[#f0f0f0d9] px-4 py-1.5 text-[15px] font-bold text-[#000000] shadow-lg">
          Talk To Us
        </span>
      </button>

      {isOpen && (
        <section className="pu-assistant-panel">
          <header className="pu-assistant-header">
            <div className="pu-assistant-header-left">
              <img src={puLogo} alt="" className="pu-assistant-header-avatar" />
              <div className="min-w-0">
                <div className="pu-assistant-title">
                  PU-Exam Cell
                  <span className={auth ? "is-connected" : "is-disconnected"} aria-hidden="true" />
                </div>
                <p className="pu-assistant-subtitle">
                  {auth?.user?.email || "Disconnected"}
                </p>
              </div>
            </div>

            <div className="pu-assistant-header-actions">
              {auth && (
                <button
                  type="button"
                  onClick={clearAuth}
                  className="pu-assistant-action-refresh"
                  aria-label="Change Google account"
                  title="Change Google account"
                >
                  <FiRefreshCw aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={closeAssistant}
                className="pu-assistant-action-close"
                aria-label="Close assistant"
                title="Close"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
          </header>

          {view === "signin" && renderSignin()}
          {view === "chat" && renderChat()}
          {view === "chat" && renderPoweredFooter()}
        </section>
      )}
    </>
  );
}
