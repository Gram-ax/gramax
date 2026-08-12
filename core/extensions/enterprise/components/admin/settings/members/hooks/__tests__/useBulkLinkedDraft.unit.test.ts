import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { type BulkLinkedRow, useBulkLinkedDraft } from "../useBulkLinkedDraft";

interface Ent {
	id: string;
}

interface Cont {
	id: string;
}

type Row = BulkLinkedRow<Ent, Cont>;

const getEntId = (x: Ent) => x.id;
const getContId = (x: Cont) => x.id;

const repos: Cont[] = [{ id: "repo-1" }, { id: "repo-2" }];

const row = (id: string, contIds: string[]): Row => ({
	ent: { id },
	containers: new Map(contIds.map((x) => [x, { cont: { id: x } }])),
});

const render = (rows: Row[], allContainers: Cont[] = repos) =>
	renderHook(() => {
		const [rowsMap, setRowsMap] = useState(() => new Map(rows.map((x) => [x.ent.id, x])));
		return useBulkLinkedDraft<Ent, Cont>({ rowsMap, setRowsMap, allContainers, getEntId, getContId });
	});

describe("useBulkLinkedDraft", () => {
	it("exposes the initial rows", () => {
		const { result } = render([row("u1", ["repo-1"])]);

		expect(result.current.rows).toEqual([row("u1", ["repo-1"])]);
	});

	describe("add", () => {
		it("links the entity to every container", () => {
			const { result } = render([]);

			act(() => result.current.add([{ ent: { id: "u1" } }]));

			expect(result.current.rows).toEqual([row("u1", ["repo-1", "repo-2"])]);
		});

		it("replaces the links of an existing row", () => {
			const { result } = render([row("u1", ["repo-3"])]);

			act(() => result.current.add([{ ent: { id: "u1" } }]));

			expect(result.current.rows).toEqual([row("u1", ["repo-1", "repo-2"])]);
		});

		it("links to nothing when there are no containers", () => {
			const { result } = render([], []);

			act(() => result.current.add([{ ent: { id: "u1" } }]));

			expect(result.current.rows).toEqual([row("u1", [])]);
		});
	});

	describe("remove", () => {
		it("drops only the listed rows", () => {
			const { result } = render([row("u1", ["repo-1"]), row("u2", ["repo-2"])]);

			act(() => result.current.remove(["u1", "missing"]));

			expect(result.current.rows).toEqual([row("u2", ["repo-2"])]);
		});
	});

	describe("applyToAll", () => {
		it("adds the missing containers and keeps the existing ones", () => {
			const initial = row("u1", ["repo-1"]);
			const { result } = render([initial]);

			act(() => result.current.applyToAll([initial]));

			expect(result.current.rows).toEqual([row("u1", ["repo-1", "repo-2"])]);
		});

		it("keeps containers that are not part of allContainers", () => {
			const initial = row("u1", ["repo-3"]);
			const { result } = render([initial]);

			act(() => result.current.applyToAll([initial]));

			expect(result.current.rows).toEqual([row("u1", ["repo-3", "repo-1", "repo-2"])]);
		});

		it("touches only the passed rows", () => {
			const first = row("u1", ["repo-1"]);
			const second = row("u2", ["repo-1"]);
			const { result } = render([first, second]);

			act(() => result.current.applyToAll([first]));

			expect(result.current.rows).toEqual([row("u1", ["repo-1", "repo-2"]), second]);
		});
	});

	it("exposes the coverage column", () => {
		const { result } = render([]);

		expect(result.current.columns.map((x) => x.id)).toEqual(["coverage"]);
	});
});
