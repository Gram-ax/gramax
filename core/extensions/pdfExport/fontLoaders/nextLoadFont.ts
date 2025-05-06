import fs from "fs";
import path from "path";

export const loadFontBuffer =
	(fontDir: string) =>
	(fontPath: string): Promise<ArrayBuffer> => {
		const fullPath = path.join(process.cwd(), fontDir, fontPath);
		const buffer = fs.readFileSync(fullPath);

		const arrayBuffer = buffer.buffer.slice(
			buffer.byteOffset,
			buffer.byteOffset + buffer.byteLength,
		) as ArrayBuffer;

		return Promise.resolve(arrayBuffer);
	};
