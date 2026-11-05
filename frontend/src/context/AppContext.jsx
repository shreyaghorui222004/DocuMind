import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as S from "../store.js";
import { askQuestion, uploadPdf } from "../api.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const uid = () => crypto.randomUUID();

export const GREETING = `# 👋 Welcome to DocuMind!\n\nYour personal AI document assistant is ready.\n\nI can help you:\n\n- Summarize your PDFs.\n- Explain complex topics.\n- Find specific information.\n- Identify important points.\n- Generate questions and answers.\n\nUpload a document or ask me anything about your knowledge library.`;
export const docWelcome = (name, pages) =>
  `# 👋 Welcome to DocuMind!\n\nYour document **${name}** has been successfully processed.\n\nI've indexed ${pages} page${pages === 1 ? "" : "s"} and I'm ready to answer questions about it.\n\nWhat would you like to know?`;

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => S.getSessionUser());
  const [data, setData] = useState(() => (user ? S.loadData(user.id) : { docs: [], convs: [] }));
  const [prefs, setPrefs] = useState(S.loadPrefs);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState([]);
  const busyRef = useRef(false);
  const prefsRef = useRef(prefs); prefsRef.current = prefs;

  useEffect(() => {
    if (user) S.saveData(user.id, { docs: data.docs.filter((d) => d.status === "ready"), convs: data.convs });
  }, [data, user]);

  const toast = useCallback((text, kind = "ok") => {
    if (kind === "ok" && !prefsRef.current.toasts) return;
    const id = uid();
    setToasts((p) => [...p, { id, text, kind }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const setConvs = (fn) => setData((p) => ({ ...p, convs: fn(p.convs) }));
  const setDocs = (fn) => setData((p) => ({ ...p, docs: fn(p.docs) }));
  const addMsg = (cid, m) => setConvs((c) => c.map((x) => (x.id === cid ? { ...x, updated: Date.now(), messages: [...x.messages, m] } : x)));

  // ----- auth -----
  const enter = (u) => { setUser(u); setData(S.loadData(u.id)); return u; };
  const signup = async (f) => enter(await S.signup(f));
  const login = async (f) => enter(await S.login(f));
  const logout = () => { S.endSession(); setUser(null); setData({ docs: [], convs: [] }); };
  const updateProfile = (patch) => setUser(S.updateProfile(user.id, patch));
  const deleteAccount = () => { S.deleteAccount(user.id); setUser(null); setData({ docs: [], convs: [] }); };
  const changePrefs = (p) => { const n = { ...prefs, ...p }; setPrefs(n); S.savePrefs(n); };

  // ----- conversations -----
  const createConv = (title, messages = [], docId = null) => {
    const id = uid(), now = Date.now();
    setConvs((c) => [{ id, title: title.slice(0, 60), created: now, updated: now, docId, messages }, ...c]);
    return id;
  };
  const renameConv = (id, title) => title.trim() && setConvs((c) => c.map((x) => (x.id === id ? { ...x, title: title.trim().slice(0, 60) } : x)));
  const deleteConv = (id) => setConvs((c) => c.filter((x) => x.id !== id));

  const ask = async (cid, question) => {
    busyRef.current = true; setBusy(true);
    try {
      const r = await askQuestion(question, 3);
      if (typeof r.answer !== "string" || !r.answer.trim()) throw new Error("The AI returned an empty answer.");
      addMsg(cid, { role: "ai", content: r.answer, sources: Array.isArray(r.sources) ? r.sources : [], time: Date.now() });
    } catch (e) {
      addMsg(cid, { role: "ai", content: e.message || "Something went wrong.", error: true, time: Date.now() });
      toast(e.message || "Chat request failed", "err");
    } finally { busyRef.current = false; setBusy(false); }
  };

  const send = (cid, text) => {
    const q = text?.trim();
    if (!q || busyRef.current) return cid;
    const msg = { role: "user", content: q, time: Date.now() };
    let id = cid;
    if (!id) id = createConv(q, [{ role: "ai", content: GREETING, time: Date.now() }, msg]); else addMsg(id, msg);
    ask(id, q);
    return id;
  };

  const regenerate = (cid) => {
    if (busyRef.current) return;
    const c = data.convs.find((x) => x.id === cid);
    const last = c && [...c.messages].reverse().find((m) => m.role === "user");
    if (!last) return;
    setConvs((cs) => cs.map((x) => (x.id === cid ? { ...x, messages: x.messages.slice(0, -1) } : x)));
    ask(cid, last.content);
  };

  // ----- documents -----
  const docIntro = (d) => [
    { role: "document", filename: d.filename, total_pages: d.total_pages, total_chunks: d.total_chunks, time: Date.now() },
    { role: "ai", content: docWelcome(d.filename, d.total_pages), sources: [], time: Date.now() },
  ];
  const chatAboutDoc = (d) => createConv(d.filename.replace(/\.pdf$/i, ""), docIntro(d), d.id);

  const uploadFiles = async (fileList) => {
    let lastConv = null;
    for (const file of Array.from(fileList || [])) {
      if (!file.name.toLowerCase().endsWith(".pdf")) { toast(`${file.name} is not a PDF`, "err"); continue; }
      const id = uid();
      const patch = (u) => setDocs((p) => p.map((d) => (d.id === id ? { ...d, ...u } : d)));
      setDocs((p) => [{ id, filename: file.name, size: file.size, status: "uploading", progress: 0, created: Date.now() }, ...p]);
      try {
        const r = await uploadPdf(file, (progress) => patch({ progress, status: progress === 100 ? "processing" : "uploading" }));
        const d = { id, filename: r.filename || file.name, total_pages: r.total_pages, total_chunks: r.total_chunks,
          document_id: r.document_id, status: "ready", progress: 100, created: Date.now() };
        patch(d); lastConv = chatAboutDoc(d);
        toast(`${d.filename} processed successfully`);
      } catch (e) { patch({ status: "error", error: e.message }); toast(e.message || "PDF upload failed", "err"); }
    }
    return lastConv;
  };
  const deleteDoc = (id) => setDocs((p) => p.filter((d) => d.id !== id));

  return (
    <Ctx.Provider value={{ user, docs: data.docs, convs: data.convs, prefs, busy, toast, signup, login, logout,
      updateProfile, deleteAccount, changePrefs, send, regenerate, renameConv, deleteConv, uploadFiles,
      deleteDoc, chatAboutDoc, hasReady: data.docs.some((d) => d.status === "ready") }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}
      </div>
    </Ctx.Provider>
  );
}
