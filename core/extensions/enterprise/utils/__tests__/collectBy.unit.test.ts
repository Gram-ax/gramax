import { collectBy } from "../collectBy";

type Member = { id: string; groups: string[] };

const entriesByGroup = (member: Member): [string, string][] =>
	member.groups.map((group) => [group, member.id] as [string, string]);

const collectMembers = (members: Member[]) => collectBy(members, entriesByGroup);

describe("collectBy", () => {
	it("returns an empty map for no rows", () => {
		expect([...collectMembers([])]).toEqual([]);
	});

	it("groups rows by key preserving row order", () => {
		const result = collectMembers([
			{ id: "u1", groups: ["admins"] },
			{ id: "u2", groups: ["readers"] },
			{ id: "u3", groups: ["admins"] },
		]);

		expect([...result]).toEqual([
			["admins", ["u1", "u3"]],
			["readers", ["u2"]],
		]);
	});

	it("spreads a row across every key it yields", () => {
		const result = collectMembers([{ id: "u1", groups: ["admins", "readers"] }]);

		expect([...result]).toEqual([
			["admins", ["u1"]],
			["readers", ["u1"]],
		]);
	});

	it("keeps duplicate values yielded by the same row", () => {
		const result = collectMembers([{ id: "u1", groups: ["admins", "admins"] }]);

		expect([...result]).toEqual([["admins", ["u1", "u1"]]]);
	});

	it("skips rows that yield no entries", () => {
		const result = collectMembers([
			{ id: "u1", groups: [] },
			{ id: "u2", groups: ["admins"] },
		]);

		expect([...result]).toEqual([["admins", ["u2"]]]);
	});

	it("accepts any iterable of entries", () => {
		const result = collectBy([new Map([["admins", 2]])], (row) => row);

		expect([...result]).toEqual([["admins", [2]]]);
	});

	it("collects values of a non-string type", () => {
		const result = collectBy(
			[
				{ repo: "docs", access: { user: "u1", level: 2 } },
				{ repo: "docs", access: { user: "u2", level: 1 } },
			],
			(row) => [[row.repo, row.access]],
		);

		expect([...result]).toEqual([
			[
				"docs",
				[
					{ user: "u1", level: 2 },
					{ user: "u2", level: 1 },
				],
			],
		]);
	});
});
