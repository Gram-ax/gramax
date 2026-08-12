import isImage from "./isImage";

const buf = (bytes: number[]) => Buffer.from(bytes);

describe("isImage", () => {
	describe("returns false", () => {
		test("buffer shorter than 4 bytes", () => {
			expect(isImage(buf([0x89, 0x50, 0x4e]))).toBe(false);
		});

		test("empty buffer", () => {
			expect(isImage(buf([]))).toBe(false);
		});

		test("non-image binary data", () => {
			expect(isImage(buf([0x00, 0x01, 0x02, 0x03]))).toBe(false);
		});

		test("text content without svg tag", () => {
			expect(isImage(Buffer.from("Hello, world!"))).toBe(false);
		});

		test("xml without svg tag", () => {
			expect(isImage(Buffer.from('<?xml version="1.0"?><root/>'))).toBe(false);
		});
	});

	describe("PNG", () => {
		test("valid PNG magic bytes", () => {
			const png = buf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
			expect(isImage(png)).toBe(true);
		});

		test("wrong first byte", () => {
			expect(isImage(buf([0x00, 0x50, 0x4e, 0x47]))).toBe(false);
		});
	});

	describe("JPEG", () => {
		test("valid JPEG magic bytes", () => {
			const jpeg = buf([0xff, 0xd8, 0xff, 0xe0, 0x00]);
			expect(isImage(jpeg)).toBe(true);
		});

		test("JPEG with EXIF marker", () => {
			const jpeg = buf([0xff, 0xd8, 0xff, 0xe1, 0x00]);
			expect(isImage(jpeg)).toBe(true);
		});

		test("wrong second byte", () => {
			expect(isImage(buf([0xff, 0x00, 0xff, 0xe0]))).toBe(false);
		});
	});

	describe("GIF", () => {
		test("GIF87a magic bytes", () => {
			const gif87 = buf([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
			expect(isImage(gif87)).toBe(true);
		});

		test("GIF89a magic bytes", () => {
			const gif89 = buf([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
			expect(isImage(gif89)).toBe(true);
		});

		test("wrong fourth byte", () => {
			expect(isImage(buf([0x47, 0x49, 0x46, 0x00, 0x37, 0x61]))).toBe(false);
		});
	});

	describe("WebP", () => {
		test("valid WebP magic bytes", () => {
			const webp = buf([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
			expect(isImage(webp)).toBe(true);
		});

		test("RIFF without WEBP brand", () => {
			const riff = buf([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20]);
			expect(isImage(riff)).toBe(false);
		});

		test("buffer too short for WebP (< 12 bytes)", () => {
			const short = buf([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);
			expect(isImage(short)).toBe(false);
		});
	});

	describe("BMP", () => {
		test("valid BMP magic bytes", () => {
			const bmp = buf([0x42, 0x4d, 0x00, 0x00]);
			expect(isImage(bmp)).toBe(true);
		});

		test("wrong second byte", () => {
			expect(isImage(buf([0x42, 0x00, 0x00, 0x00]))).toBe(false);
		});
	});

	describe("ICO", () => {
		test("valid ICO magic bytes", () => {
			const ico = buf([0x00, 0x00, 0x01, 0x00]);
			expect(isImage(ico)).toBe(true);
		});

		test("wrong third byte", () => {
			expect(isImage(buf([0x00, 0x00, 0x02, 0x00]))).toBe(false);
		});
	});

	describe("AVIF / HEIC", () => {
		const ftypBox = (brand: string): Buffer => {
			const b = Buffer.alloc(12);
			b[4] = 0x66;
			b[5] = 0x74;
			b[6] = 0x79;
			b[7] = 0x70;
			Buffer.from(brand, "ascii").copy(b, 8);
			return b;
		};

		test.each(["avif", "avis", "heic", "heix", "mif1", "msf1"])('brand "%s" is recognized', (brand) => {
			expect(isImage(ftypBox(brand))).toBe(true);
		});

		test("unknown ftyp brand is rejected", () => {
			expect(isImage(ftypBox("mp41"))).toBe(false);
		});
	});

	describe("SVG", () => {
		test("SVG starting with <svg", () => {
			expect(isImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe(true);
		});

		test("SVG starting with <?xml then <svg", () => {
			expect(isImage(Buffer.from('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe(true);
		});

		test("SVG with leading whitespace", () => {
			expect(isImage(Buffer.from('  \n<svg width="100">content</svg>'))).toBe(true);
		});

		test("SVG tag without closing angle or space is rejected", () => {
			expect(isImage(Buffer.from("<svgfoo"))).toBe(false);
		});
	});
});
