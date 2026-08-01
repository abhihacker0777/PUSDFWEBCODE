import { useEffect, useRef, useState } from "react";
import { TURNSTILE_SITE_KEY } from "./loginConstants";

export default function useTurnstileCaptcha() {
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef(null);
  const turnstileWidgetRef = useRef(null);

  const resetCaptcha = () => {
    setCaptchaToken("");
    if (window.turnstile && turnstileWidgetRef.current !== null) {
      window.turnstile.reset(turnstileWidgetRef.current);
    }
  };

  useEffect(() => {
    if (!captchaRequired || !TURNSTILE_SITE_KEY) return undefined;

    let disposed = false;
    const renderCaptcha = () => {
      if (disposed || !turnstileRef.current || !window.turnstile || turnstileWidgetRef.current !== null) return;
      turnstileWidgetRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken("")
      });
    };

    if (window.turnstile) {
      renderCaptcha();
      return () => { disposed = true; };
    }

    let script = document.getElementById("turnstile-script");
    if (!script) {
      script = document.createElement("script");
      script.id = "turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    script.addEventListener("load", renderCaptcha);
    return () => {
      disposed = true;
      script.removeEventListener("load", renderCaptcha);
    };
  }, [captchaRequired]);

  useEffect(() => {
    if (captchaRequired) return undefined;
    if (window.turnstile && turnstileWidgetRef.current !== null) {
      window.turnstile.remove(turnstileWidgetRef.current);
      turnstileWidgetRef.current = null;
    }
    return undefined;
  }, [captchaRequired]);

  return {
    captchaRequired,
    captchaToken,
    resetCaptcha,
    setCaptchaRequired,
    turnstileRef
  };
}
