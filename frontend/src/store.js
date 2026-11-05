// Browser-local data layer. The current FastAPI backend has no auth/document/conversation
// endpoints, so accounts, document lists and chat history live in this browser's localStorage.
// To move to a real backend later, replace the functions in this file with fetch() calls.
const read = (k, d, s = localStorage) => { try { return JSON.parse(s.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

async function hash(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 150000, hash: "SHA-256" }, key, 256);
  return b64(bits);
}

const users = () => read("dm_users", []);
const norm = (e) => e.trim().toLowerCase();
const pub = ({ salt, hash: _h, ...u }) => u;

export function getSessionUser() {
  const id = read("dm_session", null) || read("dm_session", null, sessionStorage);
  const u = users().find((x) => x.id === id);
  return u ? pub(u) : null;
}
function startSession(id, remember) {
  localStorage.removeItem("dm_session"); sessionStorage.removeItem("dm_session");
  (remember ? localStorage : sessionStorage).setItem("dm_session", JSON.stringify(id));
}
export const endSession = () => { localStorage.removeItem("dm_session"); sessionStorage.removeItem("dm_session"); };

export async function signup({ name, email, password }) {
  const all = users();
  if (all.some((u) => u.email === norm(email))) throw new Error("An account with this email already exists");
  const salt = crypto.randomUUID();
  const u = { id: crypto.randomUUID(), name: name.trim(), email: norm(email), avatar: null,
    created: Date.now(), salt, hash: await hash(password, salt) };
  write("dm_users", [...all, u]); startSession(u.id, true);
  return pub(u);
}
export async function login({ email, password, remember }) {
  const u = users().find((x) => x.email === norm(email));
  if (!u || (await hash(password, u.salt)) !== u.hash) throw new Error("Invalid email or password");
  startSession(u.id, remember); return pub(u);
}
function patchUser(id, fn) {
  const all = users().map((u) => (u.id === id ? fn(u) : u)); write("dm_users", all);
  return pub(all.find((u) => u.id === id));
}
export const updateProfile = (id, patch) => patchUser(id, (u) => ({ ...u, ...patch }));
export async function changePassword(id, current, next) {
  const u = users().find((x) => x.id === id);
  if ((await hash(current, u.salt)) !== u.hash) throw new Error("Current password is incorrect");
  const salt = crypto.randomUUID(); const h = await hash(next, salt);
  patchUser(id, (x) => ({ ...x, salt, hash: h }));
}
export const emailExists = (email) => users().some((u) => u.email === norm(email));
export async function resetPassword(email, next) {
  const u = users().find((x) => x.email === norm(email));
  if (!u) throw new Error("No account found for that email in this browser");
  const salt = crypto.randomUUID(); const h = await hash(next, salt);
  patchUser(u.id, (x) => ({ ...x, salt, hash: h }));
}
export function deleteAccount(id) {
  write("dm_users", users().filter((u) => u.id !== id)); localStorage.removeItem(`dm_data_${id}`); endSession();
}
export const loadData = (id) => read(`dm_data_${id}`, { docs: [], convs: [] });
export const saveData = (id, d) => { try { write(`dm_data_${id}`, d); } catch {} };
export const loadPrefs = () => read("dm_prefs", { animation: true, toasts: true });
export const savePrefs = (p) => write("dm_prefs", p);
