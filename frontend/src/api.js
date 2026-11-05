const BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function uploadPdf(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", `${BASE}/documents/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.upload.onload = () => onProgress?.(100);
    xhr.onload = () => {
      let body = {};
      try { body = JSON.parse(xhr.responseText); } catch {}
      xhr.status >= 200 && xhr.status < 300 ? resolve(body) : reject(new Error(body.detail || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Cannot reach the backend. Is it running at " + BASE + "?"));
    xhr.send(form);
  });
}

export async function askQuestion(question, k = 3) {
  let res;
  try {
    res = await fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, k }),
    });
  } catch {
    throw new Error("Cannot reach the backend. Is it running at " + BASE + "?");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof body.detail === "string" ? body.detail : `Request failed (${res.status})`);
  return body;
}
