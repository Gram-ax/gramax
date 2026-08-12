const extensions = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "avif", "heic", "svg"];

const isImage = (buffer: Buffer): boolean => {
	if (buffer.length < 4) return false;

	// PNG: 89 50 4E 47
	if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;

	// JPEG: FF D8 FF
	if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

	// GIF: GIF87a / GIF89a
	if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;

	// WebP: RIFF????WEBP
	if (
		buffer.length >= 12 &&
		buffer[0] === 0x52 &&
		buffer[1] === 0x49 &&
		buffer[2] === 0x46 &&
		buffer[3] === 0x46 &&
		buffer[8] === 0x57 &&
		buffer[9] === 0x45 &&
		buffer[10] === 0x42 &&
		buffer[11] === 0x50
	)
		return true;

	// BMP: BM
	if (buffer[0] === 0x42 && buffer[1] === 0x4d) return true;

	// ICO: 00 00 01 00
	if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) return true;

	// AVIF / HEIC: ftyp box (bytes 4–7 = "ftyp", then brand)
	if (buffer.length >= 12 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
		const brand = buffer.toString("ascii", 8, 12);
		if (["avif", "avis", "heic", "heix", "mif1", "msf1"].includes(brand)) {
			return true;
		}
	}

	// SVG: текстовый XML — ищем <svg в первых 512 байтах
	const head = buffer.slice(0, 512).toString("utf8").trimStart();
	if (head.startsWith("<?xml") || head.startsWith("<svg")) {
		return /<svg[\s>]/i.test(head);
	}

	return false;
};

export const isImageByExtension = (extension: string): boolean => {
	return extensions.includes(extension);
};

export default isImage;
