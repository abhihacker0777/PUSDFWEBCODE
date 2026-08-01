import { FiExternalLink } from "react-icons/fi";
import puLogo from "../../assets/logo.png";
import { getSafeUrl } from "./assistantAuth";

function AssistantResultLink({ paper, resultIndex }) {
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
}

function AssistantMessage({ message, index }) {
  return (
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
              {message.results.map((paper, resultIndex) => (
                <AssistantResultLink
                  key={`${paper.name}-${resultIndex}`}
                  paper={paper}
                  resultIndex={resultIndex}
                />
              ))}
            </div>
          )}
        </div>
        <div className="pu-assistant-message-time">{message.time}</div>
      </div>
    </div>
  );
}

function AssistantTyping() {
  return (
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
  );
}

function SendIcon() {
  return (
    <>
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
    </>
  );
}

export default function PaperAssistantChat({
  input,
  isLoading,
  messages,
  messagesRef,
  onInputChange,
  onSubmit
}) {
  return (
    <>
      <div ref={messagesRef} className="pu-assistant-pattern pu-assistant-chat-area">
        <div className="pu-assistant-message-stack">
          {messages.map((message, index) => (
            <AssistantMessage key={`${message.role}-${index}`} message={message} index={index} />
          ))}

          {isLoading && <AssistantTyping />}
        </div>
      </div>

      <form onSubmit={onSubmit} className="pu-assistant-input-bar">
        <div className="pu-assistant-input-wrap">
          <input
            type="text"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Type your message..."
            className="pu-assistant-input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="pu-assistant-send"
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </>
  );
}
