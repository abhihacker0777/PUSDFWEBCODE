import { FiRefreshCw, FiX } from "react-icons/fi";
import puLogo from "../../assets/logo.png";
import sarvamLogoSvg from "../../assets/pusarvamlogo.svg";
import PaperAssistantChat from "./PaperAssistantChat";
import PaperAssistantSignin from "./PaperAssistantSignin";

function PoweredFooter() {
  return (
    <div className="pu-assistant-powered flex items-center justify-center gap-1 pb-2">
      Powered By
      <a href="https://www.sarvam.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
        <img src={sarvamLogoSvg} alt="Sarvam AI" className="h-3 inline-block ml-1 opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />
      </a>
    </div>
  );
}

export default function PaperAssistantPanel({
  auth,
  clearAuth,
  closeAssistant,
  config,
  googleButtonRef,
  handleSubmit,
  input,
  isLoading,
  isSigningIn,
  messages,
  messagesRef,
  setInput,
  signInError,
  view
}) {
  return (
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

      {view === "signin" && (
        <PaperAssistantSignin
          config={config}
          googleButtonRef={googleButtonRef}
          isSigningIn={isSigningIn}
          signInError={signInError}
        />
      )}
      {view === "chat" && (
        <PaperAssistantChat
          input={input}
          isLoading={isLoading}
          messages={messages}
          messagesRef={messagesRef}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />
      )}
      {view === "chat" && <PoweredFooter />}
    </section>
  );
}
