import fs from "fs/promises";
import path from "path";

export const loadFontBuffer = async (fontPath: string): Promise<ArrayBuffer> => {
	const fullPath = path.join(process.cwd(), "public", "fonts", fontPath);
	const buffer = await fs.readFile(fullPath);

	const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

	return arrayBuffer;
};
