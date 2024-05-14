import { createRoot } from "react-dom/client";
import Settings from "./Settings";

import "../../../../core/styles/vars.css";
import "./styles.css";

const root = createRoot(document.getElementById("root"));
root.render(<Settings />);
