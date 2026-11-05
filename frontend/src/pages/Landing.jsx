import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { useApp } from "../context/AppContext.jsx";

const FEATURES = [
  ["📄", "Chat with any PDF", "Ask questions in plain language and get answers grounded in your own documents."],
  ["🔎", "Semantic search", "Meaning-based retrieval finds the right passages, not just matching keywords."],
  ["📌", "Cited sources", "Every answer shows the file and page it came from, so you can verify it."],
  ["🗂️", "Document library", "Keep every upload organised, searchable and ready to question again."],
  ["💬", "Saved conversations", "Pick up any past chat. Search, rename and clean up your history."],
  ["⚡", "Fast generation", "Retrieval plus a Groq-hosted LLM turns context into clear Markdown answers."],
];
const STEPS = [["1", "Upload", "Drop in a PDF. DocuMind extracts, cleans and chunks the text."], ["2", "Index", "Each chunk is embedded and stored in a vector database."], ["3", "Ask", "Retrieve the best passages and get a sourced answer."]];
const STACK = ["React", "Vite", "FastAPI", "LangChain", "Cohere Embeddings", "Neon PostgreSQL", "pgvector", "Groq"];

export default function Landing() {
  const { user } = useApp();
  return (
    <div className="public">
      <nav className="topnav">
        <Logo />
        <div className="row">
          <a href="#features" className="navlink">Features</a><a href="#how" className="navlink">How it works</a>
          {user ? <Link className="btn primary" to="/dashboard">Dashboard</Link>
            : <><Link className="btn ghost" to="/login">Login</Link><Link className="btn primary" to="/signup">Get Started</Link></>}
        </div>
      </nav>
      <section className="hero">
        <span className="pill">✦ AI knowledge workspace</span>
        <h1>Turn Your Documents Into <span className="grad">Intelligence.</span></h1>
        <p>An AI-powered knowledge workspace that helps you understand, search, and interact with your documents.</p>
        <div className="row center">
          <Link className="btn primary lg" to={user ? "/dashboard" : "/signup"}>Get Started</Link>
          <a className="btn ghost lg" href="#features">Explore Features</a>
        </div>
        <small className="tag">Your Documents. Your Knowledge. One Intelligence.</small>
      </section>
      <section id="features" className="block"><h2>Everything you need to understand your documents</h2>
        <div className="grid3">{FEATURES.map(([i, t, d]) => <div key={t} className="glass tile"><span className="ti">{i}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
      <section id="how" className="block"><h2>How it works</h2>
        <div className="grid3">{STEPS.map(([n, t, d]) => <div key={t} className="glass tile"><span className="num">{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
      <section className="block"><h2>Built with a modern AI stack</h2>
        <div className="chips center">{STACK.map((s) => <span key={s} className="chip">{s}</span>)}</div></section>
      <footer className="foot2"><Logo size={24} /><small>© {new Date().getFullYear()} DocuMind. Your Documents. Your Knowledge. One Intelligence.</small></footer>
    </div>
  );
}
