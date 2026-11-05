import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Confirm from "../components/Confirm.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function Documents() {
  const { docs, deleteDoc, chatAboutDoc, toast } = useApp(); const { onFiles } = useOutletContext(); const nav = useNavigate();
  const [q, setQ] = useState(""); const [status, setStatus] = useState("all"); const [del, setDel] = useState(null);
  const list = docs.filter((d) => d.filename.toLowerCase().includes(q.toLowerCase()) && (status === "all" || d.status === status));
  return (
    <div className="scroll"><div className="page">
      <div className="row between wrap"><div><h1 className="ph">My Documents</h1><p className="sub">{docs.length} in your library</p></div>
        <label className="btn primary">⇪ Upload PDF<input type="file" accept="application/pdf" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} /></label></div>
      <div className="row gap wrap"><input className="search" placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" />
        <select className="search sel" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option><option value="ready">Ready</option><option value="processing">Processing</option><option value="error">Failed</option></select></div>
      {list.length === 0 ? <div className="empty glass">{docs.length ? "No documents match your search." : "No documents yet. Upload a PDF to begin."}</div> :
        <div className="cardgrid">{list.map((d) => (
          <div key={d.id} className="glass dcard">
            <div className="row gap"><span className="doc-icon">📄</span><div className="grow"><strong title={d.filename}>{d.filename}</strong>
              <small>{new Date(d.created).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</small></div>
              <span className={`badge ${d.status}`}>{d.status === "uploading" ? `${d.progress}%` : d.status === "ready" ? "Ready" : d.status === "error" ? "Failed" : "Processing"}</span></div>
            {d.status === "ready" && <div className="facts"><span>{d.total_pages} pages</span><span>{d.total_chunks} chunks</span></div>}
            {d.status === "error" && <small className="form-err">{d.error}</small>}
            <div className="row gap">
              <button className="btn primary sm" disabled={d.status !== "ready"} onClick={() => nav(`/chat/${chatAboutDoc(d)}`)}>Ask questions</button>
              <button className="btn ghost sm" onClick={() => setDel(d)}>Delete</button></div>
          </div>))}</div>}
      {del && <Confirm title="Delete document?" text={`"${del.filename}" will be removed from your library. Its indexed text stays in the shared vector database until the backend adds a delete endpoint.`}
        onCancel={() => setDel(null)} onConfirm={() => { deleteDoc(del.id); setDel(null); toast("Document removed from library"); }} />}
    </div></div>
  );
}
