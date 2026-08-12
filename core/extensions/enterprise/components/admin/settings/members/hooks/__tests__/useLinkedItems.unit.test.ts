import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { useLinkedItems } from "../useLinkedItems";

interface Ent {
	id: string;
	name: string;
}

const getId = (x: Ent) => x.id;

const render = (ents: Ent[]) =>
	renderHook(() => {
		const [rowsMap, setRowsMap] = useState(() => new Map(ents.map((x) => [x.id, x])));
		return useLinkedItems<Ent>({ rowsMap, setRowsMap, getId });
	});

describe("useLinkedItems", () => {
	it("exposes the initial rows in insertion order", () => {
		const { result } = render([
			{ id: "a", name: "A" },
			{ id: "b", name: "B" },
		]);

		expect(result.current.rows).toEqual([
			{ id: "a", name: "A" },
			{ id: "b", name: "B" },
		]);
	});

	describe("add", () => {
		it("appends new items", () => {
			const { result } = render([{ id: "a", name: "A" }]);

			act(() => result.current.add([{ id: "b", name: "B" }]));

			expect(result.current.rows).toEqual([
				{ id: "a", name: "A" },
				{ id: "b", name: "B" },
			]);
		});

		it("replaces an item with the same id in place", () => {
			const { result } = render([
				{ id: "a", name: "A" },
				{ id: "b", name: "B" },
			]);

			act(() => result.current.add([{ id: "a", name: "A2" }]));

			expect(result.current.rows).toEqual([
				{ id: "a", name: "A2" },
				{ id: "b", name: "B" },
			]);
		});
	});

	describe("remove", () => {
		it("drops only the listed ids", () => {
			const { result } = render([
				{ id: "a", name: "A" },
				{ id: "b", name: "B" },
			]);

			act(() => result.current.remove(["a", "missing"]));

			expect(result.current.rows).toEqual([{ id: "b", name: "B" }]);
		});
	});
});
