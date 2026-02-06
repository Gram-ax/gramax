import { loadFontBuffer } from "@ext/pdfExport/fontLoaders/loadFontBuffer";
import path from "path";
import { fileURLToPath } from "url";

export const cliLoadFont = () => {
	const assetsDir = path.dirname(fileURLToPath(import.meta.url));
	const dirname = path.dirname(assetsDir);
	return loadFontBuffer(dirname, "fonts");
};
