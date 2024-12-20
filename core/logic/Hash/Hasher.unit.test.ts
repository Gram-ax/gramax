import { XxHash } from "./Hasher";

describe("XxHash", () => {
	beforeAll(async () => await XxHash.init());

	it("хеширует несколько элементов последовательно с одинаковым результатом", () => {
		const hasher = XxHash.hasher();

		hasher.hash("hello");
		hasher.hash("world");
		const hash = hasher.finalize();

		const hasher2 = XxHash.hasher();
		hasher2.hash("hello");
		hasher2.hash("world");
		const hash2 = hasher2.finalize();

		expect(hash).toBe(hash2);
	});

	it("хеширует разные элементы с разным хешем", () => {
		const hasher = XxHash.hasher();
		hasher.hash("hello");
		const hash = hasher.finalize();

		const hasher2 = XxHash.hasher();
		hasher2.hash("world");
		const hash2 = hasher2.finalize();

		expect(hash).not.toBe(hash2);
	});
});
