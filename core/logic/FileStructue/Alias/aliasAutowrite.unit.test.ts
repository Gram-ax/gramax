import type { ItemProps } from "@core/FileStructue/Item/Item";
import { dropAutoAlias, hasManualAlias, nowMoved, recordMoveAlias } from "./aliasAutowrite";

const MOVED = "2026-07-14T10:00:00Z";

describe("aliasAutowrite", () => {
	describe("recordMoveAlias", () => {
		test("records the old path with a moved timestamp", () => {
			const props: ItemProps = {};
			recordMoveAlias(props, "install", "guide/install", MOVED);
			expect(props.aliases).toEqual([{ path: "install", moved: MOVED }]);
		});

		test("chain accumulates every hop", () => {
			const props: ItemProps = {};
			recordMoveAlias(props, "a", "b", MOVED);
			recordMoveAlias(props, "b", "c", MOVED);
			expect(props.aliases).toEqual([
				{ path: "a", moved: MOVED },
				{ path: "b", moved: MOVED },
			]);
		});

		test("returning home cleans the self-alias (A -> B -> A)", () => {
			const props: ItemProps = {};
			recordMoveAlias(props, "a", "b", MOVED);
			recordMoveAlias(props, "b", "a", MOVED);
			expect(props.aliases).toEqual([{ path: "b", moved: MOVED }]);
		});

		test("an existing manual entry for the same path stays manual", () => {
			const props: ItemProps = { aliases: ["old"] };
			recordMoveAlias(props, "old", "fresh", MOVED);
			expect(props.aliases).toEqual(["old"]);
		});

		test("no-op when from equals to or from is empty", () => {
			const props: ItemProps = {};
			recordMoveAlias(props, "same", "same", MOVED);
			recordMoveAlias(props, "", "target", MOVED);
			expect(props.aliases).toBeUndefined();
		});

		test("unrelated manual aliases ride along", () => {
			const props: ItemProps = { aliases: ["hand/made"] };
			recordMoveAlias(props, "a", "b", MOVED);
			expect(props.aliases).toEqual(["hand/made", { path: "a", moved: MOVED }]);
		});
	});

	describe("dropAutoAlias", () => {
		test("removes an auto entry and reports the change", () => {
			const props: ItemProps = { aliases: [{ path: "shared", moved: MOVED }, "keep/me"] };
			expect(dropAutoAlias(props, "shared")).toBe(true);
			expect(props.aliases).toEqual(["keep/me"]);
		});

		test("never removes a manual entry", () => {
			const props: ItemProps = { aliases: ["shared"] };
			expect(dropAutoAlias(props, "shared")).toBe(false);
			expect(props.aliases).toEqual(["shared"]);
		});

		test("deletes the key when the last entry goes", () => {
			const props: ItemProps = { aliases: [{ path: "only", moved: MOVED }] };
			expect(dropAutoAlias(props, "only")).toBe(true);
			expect(props.aliases).toBeUndefined();
		});
	});

	describe("hasManualAlias", () => {
		test("matches bare strings only, with normalization", () => {
			const props: ItemProps = { aliases: ["/hand/made.md", { path: "auto/one", moved: MOVED }] };
			expect(hasManualAlias(props, "hand/made")).toBe(true);
			expect(hasManualAlias(props, "auto/one")).toBe(false);
			expect(hasManualAlias(props, "missing")).toBe(false);
		});
	});

	test("nowMoved emits UTC ISO 8601 at second precision", () => {
		expect(nowMoved()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
	});
});
