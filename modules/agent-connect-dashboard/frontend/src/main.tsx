// Hybrid IDS Frontend
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle redirect from 404.html for client-side routing
const urlParams = new URLSearchParams(window.location.search);
const redirect = urlParams.get('redirect');
if (redirect) {
  window.history.replaceState({}, '', redirect);
}

createRoot(document.getElementById("root")!).render(<App />);
