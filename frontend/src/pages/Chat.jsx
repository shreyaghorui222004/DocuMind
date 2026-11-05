import { useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import ChatInput from "../components/ChatInput.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import { GREETING, useApp } from "../context/AppContext.jsx";
import { useOutletContext } from "react-router-dom";

const PROMPTS = ["Summarize my document.", "Explain the main concepts.", "What are the important topics?", "Generate questions from this PDF."];

export default function Chat() {
  const { id } = useParams(); const nav = useNavigate(); const { onFiles } = useOutletContext();
  const { convs, busy, hasReady, send, regenerate, toast } = useApp();
  const conv = convs.find((c) => c.id === id); const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [conv?.messages.length, busy, id]);
  if (id && !conv) return <Navigate to="/chat" replace />;

  const go = (text) => { const cid = send(id, text); if (cid && cid !== id) nav(`/chat/${cid}`, { replace: !id }); };

  return (
    <>
      <div className="scroll"><div className="thread">
        {!conv ? (
          <div className="msg ai"><div className="bubble glass-b">
            {GREETING.split("\n").filter(Boolean).map((l, i) => l.startsWith("# ") ? <h2 key={i}>{l.slice(2)}</h2> : l.startsWith("- ") ? <p key={i}>• {l.slice(2)}</p> : <p key={i}>{l}</p>)}
            <div className="chips">{PROMPTS.map((p) => <button key={p} className="chip" disabled={!hasReady || busy} onClick={() => go(p)}>{p}</button>)}</div>
          </div></div>
        ) : conv.messages.map((m, i) => m.role === "document" ? (
          <div key={i} className="doc-card glass"><span className="doc-icon">📄</span>
            <div><strong>{m.filename}</strong><small>{m.total_pages} pages · {m.total_chunks} chunks indexed</small></div><span className="doc-status">✓ Ready</span></div>
        ) : <ChatMessage key={`${id}-${i}`} m={m} toast={toast} onRegenerate={() => regenerate(id)}
          isLast={i === conv.messages.length - 1 && m.role === "ai" && !busy && conv.messages.some((x) => x.role === "user")} />)}
        {busy && <div className="msg ai"><div className="bubble skeleton"><span /><span /><span /></div></div>}
        <div ref={end} />
      </div></div>
      <ChatInput onSend={go} onFiles={onFiles} disabled={busy || !hasReady} />
      {!hasReady && <p className="foot">Upload a PDF and wait for it to finish processing to start chatting.</p>}
    </>
  );
}
