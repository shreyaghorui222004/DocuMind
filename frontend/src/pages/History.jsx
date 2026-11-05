import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Confirm from "../components/Confirm.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function History() {
  const { convs, renameConv, deleteConv, toast } = useApp(); const nav = useNavigate();
  const [q, setQ] = useState(""); const [edit, setEdit] = useState(null); const [name, setName] = useState(""); const [del, setDel] = useState(null);
  const list = convs.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.updated || b.created) - (a.updated || a.created));
  const save = () => { renameConv(edit, name); setEdit(null); };
  return (
    <div className="scroll"><div className="page">
      <div className="row between wrap"><div><h1 className="ph">Chat History</h1><p className="sub">{convs.length} conversations</p></div>
        <button className="btn primary" onClick={() => nav("/chat")}>＋ New Chat</button></div>
      <input className="search" placeholder="Search conversations…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search conversations" />
      {list.length === 0 ? <div className="empty glass">{convs.length ? "No conversations match your search." : "No conversations yet."}</div> :
        <ul className="list">{list.map((c) => (
          <li key={c.id} className="glass item">
            <span className="doc-icon">💬</span>
            <div className="grow">{edit === c.id
              ? <input className="search" autoFocus value={name} maxLength={60} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEdit(null); }} onBlur={save} aria-label="Conversation title" />
              : <button className="linkbtn" onClick={() => nav(`/chat/${c.id}`)}><strong>{c.title}</strong></button>}
              <small>{new Date(c.updated || c.created).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {c.messages.filter((m) => m.role === "user").length} questions</small></div>
            <button className="btn ghost sm" onClick={() => nav(`/chat/${c.id}`)}>Open</button>
            <button className="btn ghost sm" onClick={() => { setEdit(c.id); setName(c.title); }}>Rename</button>
            <button className="btn ghost sm" onClick={() => setDel(c)}>Delete</button>
          </li>))}</ul>}
      {del && <Confirm title="Delete conversation?" text={`"${del.title}" and all its messages will be permanently deleted.`}
        onCancel={() => setDel(null)} onConfirm={() => { deleteConv(del.id); setDel(null); toast("Conversation deleted"); }} />}
    </div></div>
  );
}
