import ReactMarkdown from "react-markdown";

const time = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatMessage({ m, onRegenerate, isLast, toast }) {
  if (m.role === "user") return <div className="msg user"><div className="bubble">{m.content}</div><small>{time(m.time)}</small></div>;
  return (
    <div className={`msg ai ${m.error ? "err" : ""}`}>
      <div className="bubble">
        <ReactMarkdown>{m.content}</ReactMarkdown>
      </div>
      <div className="meta">
        <small>{time(m.time)}</small>
        <button onClick={() => navigator.clipboard.writeText(m.content).then(() => toast("Answer copied"))}>Copy</button>
        {isLast && <button onClick={onRegenerate}>Regenerate</button>}
      </div>
    </div>
  );
}