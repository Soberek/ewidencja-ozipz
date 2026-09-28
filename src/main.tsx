import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { applyTheme, readStoredTheme } from "./lib/theme";
import "./index.css";

// Motyw musi być ustawiony przed pierwszym renderem, inaczej po przeładowaniu wraca jasny.
applyTheme(readStoredTheme());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
