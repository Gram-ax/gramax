import "@fortawesome/fontawesome-pro/css/all.css";
import "../../../core/styles/ProseMirror.css";
import "../../../core/styles/admonition.css";
import "../../../core/styles/article-alfabeta.css";
import "../../../core/styles/article.css";
import "../../../core/styles/global.css";
import "../../../core/styles/swagger-ui-theme.css";
import "../../../core/styles/vars.css";

import { createRoot } from "react-dom/client";
import App from "./App";
import * as debug from "./debug";

(window as any).debug = debug;

const container = document.getElementById("root");

const root = createRoot(container);
root.render(<App />);
