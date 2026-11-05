import { useRef, useState } from "react";
export default function ChatInput({ onSend, onFiles, disabled }) {
  const [v, setV] = useState("");
  const file = useRef();
  const send = () => { if (v.trim() && !disabled) { onSend(v.trim()); setV(""); } };
  return (
    <div className="composer">
      <input ref={file} type="file" accept="application/pdf" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      <textarea
        rows={1} value={v} placeholder="Ask anything about your uploaded documents..."
        aria-label="Message"
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
      />
      <button className="round ghost" onClick={() => file.current.click()} aria-label="Attach PDF">📎</button>
      <button className="round go" onClick={send} disabled={disabled || !v.trim()} aria-label="Send">➤</button>
    </div>
  );
}
