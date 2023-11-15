import { useEffect } from "react";
import Theme from "../../../Theme/Theme";
import { openPrintView } from "./OpenPrintView";

const interceptPrintShortkeys = (isMac: boolean, theme: Theme) => {
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (!((isMac ? e.metaKey : e.ctrlKey) && e.code === "KeyP")) return;
			e.preventDefault();
			void openPrintView(theme);
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => {
			window.removeEventListener("keydown", handleKeyPress);
		};
	}, []);
};

export default interceptPrintShortkeys;
