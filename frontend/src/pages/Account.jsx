import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confirm from "../components/Confirm.jsx";
import { Avatar } from "../components/Layout.jsx";
import { useApp } from "../context/AppContext.jsx";
import { changePassword } from "../store.js";

function resize(file, size = 160) {
  return new Promise((res, rej) => {
    const img = new Image(); img.onload = () => {
      const c = document.createElement("canvas"); c.width = c.height = size; const s = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size); res(c.toDataURL("image/jpeg", 0.85));
    }; img.onerror = () => rej(new Error("Could not read that image")); img.src = URL.createObjectURL(file);
  });
}

function PasswordForm() {
  const { user, toast } = useApp(); const [f, setF] = useState({ cur: "", next: "", conf: "" }); const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (f.next.length < 8 || !/\d/.test(f.next) || !/[A-Za-z]/.test(f.next)) return setErr("New password needs 8+ characters with a letter and a number");
    if (f.next !== f.conf) return setErr("New passwords do not match");
    try { await changePassword(user.id, f.cur, f.next); setF({ cur: "", next: "", conf: "" }); toast("Password changed"); } catch (x) { setErr(x.message); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="glass panel" onSubmit={submit}><h3>Change password</h3>
      <label className="field"><span>Current password</span><input type="password" value={f.cur} onChange={set("cur")} autoComplete="current-password" required /></label>
      <label className="field"><span>New password</span><input type="password" value={f.next} onChange={set("next")} autoComplete="new-password" required /></label>
      <label className="field"><span>Confirm new password</span><input type="password" value={f.conf} onChange={set("conf")} autoComplete="new-password" required /></label>
      {err && <div className="form-err" role="alert">{err}</div>}<button className="btn primary">Update password</button></form>
  );
}

export function Profile() {
  const { user, updateProfile, logout, toast } = useApp(); const nav = useNavigate(); const pick = useRef(null);
  const [name, setName] = useState(user.name); const [err, setErr] = useState("");
  const photo = async (file) => { try { updateProfile({ avatar: await resize(file) }); toast("Profile picture updated"); } catch (e) { toast(e.message, "err"); } };
  const save = (e) => { e.preventDefault(); if (name.trim().length < 2) return setErr("Name is too short"); setErr(""); updateProfile({ name: name.trim() }); toast("Profile saved"); };
  return (
    <div className="scroll"><div className="page narrow">
      <h1 className="ph">Profile</h1>
      <form className="glass panel" onSubmit={save}>
        <div className="row gap"><div className="bigav"><Avatar user={user} /></div>
          <div><button type="button" className="btn ghost sm" onClick={() => pick.current.click()}>Upload photo</button>
            {user.avatar && <button type="button" className="btn ghost sm" onClick={() => updateProfile({ avatar: null })}>Remove</button>}
            <input ref={pick} type="file" accept="image/*" hidden onChange={(e) => { e.target.files[0] && photo(e.target.files[0]); e.target.value = ""; }} /></div></div>
        <label className="field"><span>Full name</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label className="field"><span>Email</span><input value={user.email} disabled /></label>
        <small className="hint">Member since {new Date(user.created).toLocaleDateString([], { dateStyle: "long" })}</small>
        {err && <div className="form-err">{err}</div>}<button className="btn primary">Save changes</button>
      </form>
      <PasswordForm />
      <button className="btn ghost" onClick={() => { logout(); nav("/login"); }}>⎋ Logout</button>
    </div></div>
  );
}

export function Settings() {
  const { prefs, changePrefs, logout, deleteAccount } = useApp(); const nav = useNavigate(); const [del, setDel] = useState(false);
  const Row = ({ label, hint, k }) => (
    <label className="row between setrow"><span><b>{label}</b><small>{hint}</small></span>
      <input type="checkbox" className="switch" checked={prefs[k]} onChange={(e) => changePrefs({ [k]: e.target.checked })} /></label>);
  return (
    <div className="scroll"><div className="page narrow">
      <h1 className="ph">Settings</h1>
      <div className="glass panel"><h3>Appearance</h3><Row k="animation" label="Animated AI background" hint="Particles and glowing waves. Automatically off if your device prefers reduced motion." /></div>
      <div className="glass panel"><h3>Notifications</h3><Row k="toasts" label="Success notifications" hint="Show a pop-up when uploads and saves succeed. Errors always show." /></div>
      <div className="glass panel"><h3>Security</h3><small className="hint">Change your password from the Profile page.</small>
        <button className="btn ghost" onClick={() => { logout(); nav("/login"); }}>⎋ Logout</button></div>
      <div className="glass panel danger-zone"><h3>Delete account</h3><small className="hint">Permanently removes your account, document list and conversations from this browser.</small>
        <button className="btn danger" onClick={() => setDel(true)}>Delete account</button></div>
      {del && <Confirm title="Delete your account?" text="This cannot be undone. All your local data will be erased." confirmLabel="Delete account"
        onCancel={() => setDel(false)} onConfirm={() => { deleteAccount(); nav("/"); }} />}
    </div></div>
  );
}
