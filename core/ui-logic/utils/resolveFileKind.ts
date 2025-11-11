const SIGNATURES = {
	"image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
	"image/jpg": [0xff, 0xd8],
	"image/gif": [0x47, 0x49, 0x46],
	"application/pdf": [0x25, 0x50, 0x44, 0x46],
};

const isSvg = (data: Buffer): boolean => {
	if (data[0] === 0x3c) return true;
	// UTF-8 BOM
	if (data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf && data[3] === 0x3c) return true;

	return false;
};

export const resolveFileKind = (data: Buffer): string => {
	const signature = Object.entries(SIGNATURES).find(([, v]) => v.every((b, i) => b == data[i]))?.[0];
	if (signature) return signature;
	if (isSvg(data)) return "image/svg+xml";

	return "image/png";
};
