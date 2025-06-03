import fs from "fs";
import path from "path";

export const nextLoadFont = () => loadFontBuffer(process.cwd(), "public/fonts");

export const loadFontBuffer =
	(baseDir: string, fontDir: string) =>
	(fontPath: string): Promise<ArrayBuffer> => {
		const fullPath = path.join(baseDir, fontDir, fontPath);
		const buffer = fs.readFileSync(fullPath);

		const arrayBuffer = buffer.buffer.slice(
			buffer.byteOffset,
			buffer.byteOffset + buffer.byteLength,
		) as ArrayBuffer;

		return Promise.resolve(arrayBuffer);
	};
