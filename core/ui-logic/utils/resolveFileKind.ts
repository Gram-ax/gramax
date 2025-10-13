const SIGNATURES = {
	"image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
	"image/jpg": [0xff, 0xd8],
	"image/gif": [0x47, 0x49, 0x46],
	"image/svg+xml": [0x3c],
	"application/pdf": [0x25, 0x50, 0x44, 0x46],
};

export const resolveFileKind = (data: Buffer): string =>
	Object.entries(SIGNATURES).find(([, v]) => v.every((b, i) => b == data[i]))?.[0] ?? "image/png";
