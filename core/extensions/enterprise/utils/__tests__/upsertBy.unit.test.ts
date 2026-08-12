import { upsertBy } from "../upsertBy";

type Access = { id: string; level: string };

const byId = (item: Access) => item.id;
const upsertAccess = (list: Access[], row: Access) => upsertBy(list, row, byId);

describe("upsertBy", () => {
	it("appends to an empty list", () => {
		expect(upsertAccess([], { id: "u1", level: "read" })).toEqual([{ id: "u1", level: "read" }]);
	});

	it("appends when the key is absent", () => {
		const list = [{ id: "u1", level: "read" }];

		expect(upsertAccess(list, { id: "u2", level: "write" })).toEqual([
			{ id: "u1", level: "read" },
			{ id: "u2", level: "write" },
		]);
	});

	it("replaces in place when the key exists", () => {
		const list = [
			{ id: "u1", level: "read" },
			{ id: "u2", level: "read" },
		];

		expect(upsertAccess(list, { id: "u1", level: "admin" })).toEqual([
			{ id: "u1", level: "admin" },
			{ id: "u2", level: "read" },
		]);
	});

	it("replaces only the first match", () => {
		const list = [
			{ id: "u1", level: "read" },
			{ id: "u1", level: "write" },
		];

		expect(upsertAccess(list, { id: "u1", level: "admin" })).toEqual([
			{ id: "u1", level: "admin" },
			{ id: "u1", level: "write" },
		]);
	});

	it("does not mutate the source list", () => {
		const list = [{ id: "u1", level: "read" }];

		upsertAccess(list, { id: "u1", level: "admin" });
		upsertAccess(list, { id: "u2", level: "write" });

		expect(list).toEqual([{ id: "u1", level: "read" }]);
	});

	it("returns a new array on both paths", () => {
		const list = [{ id: "u1", level: "read" }];

		expect(upsertAccess(list, { id: "u1", level: "admin" })).not.toBe(list);
		expect(upsertAccess(list, { id: "u2", level: "write" })).not.toBe(list);
	});

	it("uses the provided key extractor, not identity", () => {
		const list = [{ repo: "docs", branch: "main" }];

		expect(upsertBy(list, { repo: "docs", branch: "dev" }, (item) => item.repo)).toEqual([
			{ repo: "docs", branch: "dev" },
		]);
	});
});
