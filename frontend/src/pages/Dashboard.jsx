import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const ago = (t) => {
  const m = Math.floor((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : new Date(t).toLocaleDateString();
};

export default function Dashboard() {
  const { user, docs, convs, hasReady } = useApp();
  const { onFiles } = useOutletContext(); const nav = useNavigate(); const [drag, setDrag] = useState(false);
  const ready = docs.filter((d) => d.status === "ready");
  const questions = convs.reduce((n, c) => n + c.messages.filter((m) => m.role === "user").length, 0);
  const activity = [
    ...ready.map((d) => ({ t: d.created, icon: "📄", text: `Uploaded ${d.filename}`, to: "/documents" })),
    ...convs.map((c) => ({ t: c.updated || c.created, icon: "💬", text: `Chat: ${c.title}`, to: `/chat/${c.id}` })),
  ].sort((a, b) => b.t - a.t).slice(0, 6);

  return (
    <div className="scroll"><div className="page">
      <h1 className="ph">Welcome back, {user.name.split(" ")[0]}!</h1>
      <p className="sub">Your intelligent document workspace is ready.</p>
      <div className="stats four">
        {[["Total documents", ready.length], ["Conversations", convs.length], ["Questions asked", questions], ["Pages indexed", ready.reduce((n, d) => n + (d.total_pages || 0), 0)]]
          .map(([l, v]) => <div key={l} className="glass"><b>{v}</b><small>{l}</small></div>)}
      </div>
      <label className={`drop ${drag ? "drag" : ""}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}>
        <input type="file" accept="application/pdf" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        <span className="drop-icon">⇪</span><b>{drag ? "Drop to upload" : "Drag a PDF here or browse"}</b><small>PDF files only</small>
      </label>
      <div className="row gap"><button className="btn primary" onClick={() => nav("/chat")}>＋ New Chat</button>
        {!hasReady && <small className="hint">Upload a PDF to start asking questions.</small>}</div>
      <h2 className="sh">Recent activity</h2>
      {activity.length === 0 ? <div className="empty glass">Nothing yet. Upload your first document to get started.</div> :
        <ul className="list">{activity.map((a, i) => <li key={i} className="glass item clickable" onClick={() => nav(a.to)}>
          <span className="doc-icon">{a.icon}</span><div className="grow"><strong>{a.text}</strong></div><small>{ago(a.t)}</small></li>)}</ul>}
    </div></div>
  );
}
