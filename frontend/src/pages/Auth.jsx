import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { useApp } from "../context/AppContext.jsx";
import { emailExists, resetPassword } from "../store.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const strength = (p) => {
  let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"];

function Shell({ title, sub, children }) {
  return (
    <div className="auth-wrap">
      <div className="auth glass">
        <Link to="/" aria-label="DocuMind home"><Logo /></Link>
        <h1>{title}</h1><p className="sub">{sub}</p>{children}
        <small className="demo-note">Accounts are stored in this browser only. No email is ever sent.</small>
      </div>
    </div>
  );
}
function Pw({ label, value, onChange, auto = "current-password" }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field"><span>{label}</span>
      <div className="pwbox"><input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={auto} required />
        <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? "🙈" : "👁"}</button></div>
    </label>
  );
}
const Err = ({ e }) => (e ? <div className="form-err" role="alert">{e}</div> : null);

export function Login() {
  const { user, login } = useApp(); const nav = useNavigate();
  const [f, setF] = useState({ email: "", password: "", remember: true }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (!EMAIL.test(f.email)) return setErr("Enter a valid email address");
    setBusy(true);
    try { await login({ email: f.email, password: f.password, remember: f.remember }); nav("/dashboard"); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Shell title="Welcome back" sub="Log in to your knowledge workspace.">
      <form onSubmit={submit} noValidate>
        <label className="field"><span>Email</span><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></label>
        <Pw label="Password" value={f.password} onChange={(v) => setF({ ...f, password: v })} />
        <div className="row between"><label className="check"><input type="checkbox" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} /> Remember me</label>
          <Link to="/forgot-password" className="lnk">Forgot password?</Link></div>
        <Err e={err} />
        <button className="btn primary full" disabled={busy}>{busy ? "Logging in…" : "Login"}</button>
      </form>
      <p className="alt">New to DocuMind? <Link to="/signup" className="lnk">Create an account</Link></p>
    </Shell>
  );
}

export function Signup() {
  const { user, signup } = useApp(); const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", terms: false }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const s = strength(f.password);
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (f.name.trim().length < 2) return setErr("Enter your full name");
    if (!EMAIL.test(f.email)) return setErr("Enter a valid email address");
    if (f.password.length < 8 || !/\d/.test(f.password) || !/[A-Za-z]/.test(f.password)) return setErr("Password needs 8+ characters with a letter and a number");
    if (f.password !== f.confirm) return setErr("Passwords do not match");
    if (!f.terms) return setErr("Please accept the terms to continue");
    setBusy(true);
    try { await signup({ name: f.name, email: f.email, password: f.password }); nav("/dashboard"); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Shell title="Create your account" sub="Start chatting with your documents in minutes.">
      <form onSubmit={submit} noValidate>
        <label className="field"><span>Full name</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" required /></label>
        <label className="field"><span>Email</span><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></label>
        <Pw label="Password" value={f.password} onChange={(v) => setF({ ...f, password: v })} auto="new-password" />
        {f.password && <div className="meter" aria-live="polite"><div className="bars">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= s ? `on s${s}` : ""} />)}</div><small>{LABEL[s]}</small></div>}
        <Pw label="Confirm password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} auto="new-password" />
        <label className="check"><input type="checkbox" checked={f.terms} onChange={(e) => setF({ ...f, terms: e.target.checked })} /> I agree to the Terms and Privacy Policy</label>
        <Err e={err} />
        <button className="btn primary full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="alt">Already have an account? <Link to="/login" className="lnk">Login</Link></p>
    </Shell>
  );
}

export function Forgot() {
  const { toast } = useApp(); const nav = useNavigate();
  const [step, setStep] = useState(1); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  const next = (e) => {
    e.preventDefault(); setErr("");
    if (!EMAIL.test(email)) return setErr("Enter a valid email address");
    if (!emailExists(email)) return setErr("No account with that email exists in this browser");
    setStep(2);
  };
  const save = async (e) => {
    e.preventDefault(); setErr("");
    if (pw.length < 8 || !/\d/.test(pw) || !/[A-Za-z]/.test(pw)) return setErr("Password needs 8+ characters with a letter and a number");
    try { await resetPassword(email, pw); toast("Password updated. Please log in."); nav("/login"); } catch (x) { setErr(x.message); }
  };
  return (
    <Shell title="Reset your password" sub={step === 1 ? "Enter the email you signed up with." : "Choose a new password."}>
      {step === 1 ? (
        <form onSubmit={next} noValidate>
          <label className="field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <Err e={err} /><button className="btn primary full">Continue</button>
        </form>
      ) : (
        <form onSubmit={save} noValidate>
          <Pw label="New password" value={pw} onChange={setPw} auto="new-password" /><Err e={err} />
          <button className="btn primary full">Update password</button>
        </form>
      )}
      <p className="alt"><Link to="/login" className="lnk">Back to login</Link></p>
    </Shell>
  );
}
