import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import "./index.css";

const App = lazy(() => import("./App.jsx"));
const ChatbotLead = lazy(() => import("./ChatbotLead.jsx"));
const PortalPaciente = lazy(() => import("./PortalPaciente.jsx"));

const normalizePath = (pathname) => pathname.replace(/\/+$/, "") || "/";
const path = normalizePath(window.location.pathname);

const Screen =
  path === "/portal-paciente"
    ? PortalPaciente
    : path === "/lead"
      ? ChatbotLead
      : App;

createRoot(document.getElementById("root")).render(
  <Suspense fallback={<div style={{ padding: 16 }}>Carregando...</div>}>
    <Screen />
  </Suspense>
);