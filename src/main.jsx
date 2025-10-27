import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Entry point: mount the React application into #root
// StrictMode helps surface potential problems in development (double-invoking certain lifecycle calls)
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
