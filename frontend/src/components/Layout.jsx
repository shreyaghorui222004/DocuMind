import { useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import Logo from "./Logo.jsx";

const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
export const Avatar = ({ user }) => user.avatar
  ? <img className="avatar img" src={user.avatar} alt="" /> : <div className="avatar">{initials(user.name)}</div>;

export default function Layout() {
  const { user, logout, uploadFiles, toast } = useApp();
  const [open, setOpen] = useState(false);
  const picker = useRef(null);
  const nav = useNavigate();
  const close = () => setOpen(false);
  const link = (to, label, icon) => (
    <NavLink to={to} end={to === "/dashboard"} onClick={close} className={({ isActive }) => `nav ${isActive ? "on" : ""}`}>
      <span className="ni">{icon}</span>{label}
    </NavLink>);

  const onFiles = async (files) => { const id = await uploadFiles(files); if (id) nav(`/chat/${id}`); };

  return (
    <div className="app">
      <div className={`scrim ${open ? "show" : ""}`} onClick={close} />
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Navigation">
        <div className="side-top"><Logo /><button className="close" onClick={close} aria-label="Close menu">✕</button></div>
        <button className="primary" onClick={() => { nav("/chat"); close(); }}>＋ New Chat</button>
        <button className="secondary" onClick={() => picker.current?.click()}>⇪ Upload PDF</button>
        <input ref={picker} type="file" accept=".pdf,application/pdf" multiple hidden
          onChange={(e) => { onFiles(e.target.files); e.target.value = ""; close(); }} />
        <div className="side-scroll">
          <h4>WORKSPACE</h4>
          {link("/dashboard", "Dashboard", "▦")}{link("/documents", "My Documents", "▤")}{link("/history", "Chat History", "◷")}
          <h4>ACCOUNT</h4>
          {link("/profile", "Profile", "◉")}{link("/settings", "Settings", "⚙")}
          <button className="nav" onClick={() => { logout(); toast("You have been logged out"); nav("/login"); }}><span className="ni">⎋</span>Logout</button>
        </div>
        <div className="profile"><Avatar user={user} /><div><b>{user.name}</b><small>{user.email}</small></div></div>
      </aside>
      <main>
        <header className="mobile-head"><button className="burger" onClick={() => setOpen(true)} aria-label="Open menu">☰</button><Logo size={26} /></header>
        <Outlet context={{ onFiles }} />
      </main>
    </div>
  );
}
