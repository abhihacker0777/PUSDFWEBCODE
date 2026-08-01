import { useCallback, useEffect, useRef, useState } from "react";
import {
  askPaperAssistant,
  verifyAssistantGoogleCredential
} from "../../services/api";
import {
  clearStoredAuth,
  getStoredAuth,
  isAuthError,
  loadGoogleScript,
  saveStoredAuth
} from "./assistantAuth";
import useAssistantConfig from "./useAssistantConfig";
import useAssistantMessages from "./useAssistantMessages";

export default function usePaperAssistantController() {
  const savedAuth = getStoredAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState(savedAuth ? "chat" : "signin");
  const [auth, setAuth] = useState(savedAuth);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const config = useAssistantConfig(setSignInError);
  const {
    messages,
    messagesRef,
    pushMessage,
    resetMessages
  } = useAssistantMessages(savedAuth?.user, isLoading);
  const googleButtonRef = useRef(null);

  const clearAuth = useCallback(() => {
    clearStoredAuth();
    window.google?.accounts?.id?.disableAutoSelect?.();
    setAuth(null);
    setInput("");
    resetMessages(null);
    setView("signin");
  }, [resetMessages]);

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
      saveStoredAuth(nextAuth);
      setAuth(nextAuth);
      resetMessages(verified.user);
      setView("chat");
    } catch (error) {
      setSignInError(error.message || `Please Sign In With Your ${config.emailDomain} Google Account.`);
    } finally {
      setIsSigningIn(false);
    }
  }, [config.emailDomain, resetMessages]);

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
    resetMessages(auth?.user);
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

  return {
    auth,
    clearAuth,
    closeAssistant,
    config,
    googleButtonRef,
    handleSubmit,
    input,
    isLoading,
    isOpen,
    isSigningIn,
    messages,
    messagesRef,
    openAssistant,
    setInput,
    signInError,
    view
  };
}
