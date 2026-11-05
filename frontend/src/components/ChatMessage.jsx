import { useState } from "react";
import ReactMarkdown from "react-markdown";

const time = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function Sources({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div className="sources">
      <button onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "▾" : "▸"} Sources ({sources.length})</button>
      {open && sources.map((s, i) => (
        <details key={i} className="source">
          <summary><b>{s.filename}</b> · page {s.page}</summary>
          <p>{s.content}</p>
        </details>
      ))}
    </div>
  );
}

export default function ChatMessage({ m, onRegenerate, isLast, toast }) {
  if (m.role === "user") return <div className="msg user"><div className="bubble">{m.content}</div><small>{time(m.time)}</small></div>;
  return (
    <div className={`msg ai ${m.error ? "err" : ""}`}>
      <div className="bubble">
        <ReactMarkdown>{m.content}</ReactMarkdown>
        <Sources sources={m.sources} />
      </div>
      <div className="meta">
        <small>{time(m.time)}</small>
        <button onClick={() => navigator.clipboard.writeText(m.content).then(() => toast("Answer copied"))}>Copy</button>
        {isLast && <button onClick={onRegenerate}>Regenerate</button>}
      </div>
    </div>
  );
}
