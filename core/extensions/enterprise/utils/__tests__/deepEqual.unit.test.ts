import { deepEqual } from "../deepEqual";

describe("deepEqual", () => {
	describe("primitives", () => {
		it("compares equal primitives", () => {
			expect(deepEqual(1, 1)).toBe(true);
			expect(deepEqual("a", "a")).toBe(true);
			expect(deepEqual(true, true)).toBe(true);
		});

		it("rejects different values of the same type", () => {
			expect(deepEqual(1, 2)).toBe(false);
			expect(deepEqual("a", "b")).toBe(false);
			expect(deepEqual(true, false)).toBe(false);
		});

		it("rejects different types", () => {
			expect(deepEqual(1, "1")).toBe(false);
			expect(deepEqual(0, false)).toBe(false);
		});
	});

	describe("null and undefined", () => {
		it("treats identical nullish values as equal", () => {
			expect(deepEqual(null, null)).toBe(true);
			expect(deepEqual(undefined, undefined)).toBe(true);
		});

		it("rejects nullish against anything else", () => {
			expect(deepEqual(null, undefined)).toBe(false);
			expect(deepEqual(null, {})).toBe(false);
			expect(deepEqual(undefined, "")).toBe(false);
			expect(deepEqual([], null)).toBe(false);
		});
	});

	describe("arrays", () => {
		it("compares element-wise", () => {
			expect(deepEqual(["read", "write"], ["read", "write"])).toBe(true);
			expect(deepEqual(["read", "write"], ["write", "read"])).toBe(false);
		});

		it("rejects different lengths", () => {
			expect(deepEqual(["read"], ["read", "write"])).toBe(false);
		});

		it("compares empty arrays", () => {
			expect(deepEqual([], [])).toBe(true);
		});

		it("recurses into nested elements", () => {
			expect(deepEqual([{ id: "u1", roles: ["admin"] }], [{ id: "u1", roles: ["admin"] }])).toBe(true);
			expect(deepEqual([{ id: "u1", roles: ["admin"] }], [{ id: "u1", roles: ["reader"] }])).toBe(false);
		});
	});

	describe("objects", () => {
		it("ignores key order", () => {
			expect(deepEqual({ id: "u1", role: "admin" }, { role: "admin", id: "u1" })).toBe(true);
		});

		it("rejects different key counts", () => {
			expect(deepEqual({ id: "u1" }, { id: "u1", role: "admin" })).toBe(false);
		});

		it("rejects an explicit undefined value against a missing key", () => {
			expect(deepEqual({ id: "u1" }, { id: "u1", role: undefined })).toBe(false);
		});

		it("rejects same key count with different keys", () => {
			expect(deepEqual({ id: "u1" }, { name: "u1" })).toBe(false);
		});

		it("compares empty objects", () => {
			expect(deepEqual({}, {})).toBe(true);
		});

		it("recurses into nested objects", () => {
			const a = { id: "g1", access: { repo: "docs", permissions: ["read", "write"] } };
			const b = { id: "g1", access: { repo: "docs", permissions: ["read", "write"] } };
			expect(deepEqual(a, b)).toBe(true);
			expect(deepEqual(a, { ...b, access: { repo: "docs", permissions: ["read"] } })).toBe(false);
		});
	});

	describe("mixed shapes", () => {
		it("rejects an array against an object with different keys", () => {
			expect(deepEqual(["read"], { role: "read" })).toBe(false);
		});
	});
});
