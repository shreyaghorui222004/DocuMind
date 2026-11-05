import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext.jsx";
import AnimatedBackground from "./components/AnimatedBackground.jsx";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import { Login, Signup, Forgot } from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Chat from "./pages/Chat.jsx";
import Documents from "./pages/Documents.jsx";
import History from "./pages/History.jsx";
import { Profile, Settings } from "./pages/Account.jsx";

function Protected({ children }) {
  const { user } = useApp();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <AnimatedBackground />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
