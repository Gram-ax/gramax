import { fileURLToPath } from "url";
import path from "path";
import { loadFontBuffer } from "@ext/pdfExport/fontLoaders/loadFontBuffer";

export const cliLoadFont = () => {
	const assetsDir = path.dirname(fileURLToPath(import.meta.url));
	const dirname = path.dirname(assetsDir);
	return loadFontBuffer(dirname, "fonts");
};
