import type { Item } from "@core/FileStructue/Item/Item";
import type { AliasEntry } from "./AliasIndex";
import { CatalogAliases } from "./CatalogAliases";

// CatalogAliases owns the whole alias surface: the lazily built AliasIndex
// (lookup + diagnostics) and the write policy. The fake catalog below only
// supplies items; deep resolution rules (prefix match, chronology, caps) are
// covered in AliasIndex.unit.test.ts.

type FakeItem = Item & { save: jest.Mock };

const makeItem = (relativePath: string, aliases?: AliasEntry[]): FakeItem =>
	({
		type: "article",
		logicPath: `root/${relativePath}`,
		props: aliases ? { aliases } : {},
		save: jest.fn(async () => {}),
	}) as unknown as FakeItem;

const makeAliases = (items: FakeItem[]) => {
	const searcher = {
		resetCache: jest.fn(),
		findItemByLogicPath: jest.fn((_root, target: string) => items.find((i) => i.logicPath === target) ?? null),
	};
	const catalog = {
		getItems: () => items,
		getRootCategory: () => ({ logicPath: "root" }),
		relativeLogicPath: (logicPath: string) => (logicPath === "root" ? "" : logicPath.replace(/^root\//, "")),
	};
	return { aliases: new CatalogAliases(catalog as never, searcher as never), searcher };
};

describe("CatalogAliases", () => {
	describe("assertNotManual", () => {
		test("blocks a move onto a path that is someone's manual alias", () => {
			const { aliases } = makeAliases([makeItem("keeper", ["legacy/page"]), makeItem("mover")]);
			expect(() => aliases.assertNotManual("legacy/page", makeItem("mover"))).toThrow("manual alias of 'keeper'");
		});

		test("auto aliases do not block: they are stolen later, not protected", () => {
			const holder = makeItem("holder", [{ path: "legacy/page", moved: "2026-01-01T00:00:00Z" }]);
			const { aliases } = makeAliases([holder]);
			expect(() => aliases.assertNotManual("legacy/page", makeItem("mover"))).not.toThrow();
		});

		test("the mover's own manual alias does not block its move", () => {
			const mover = makeItem("mover", ["legacy/page"]);
			const { aliases } = makeAliases([mover]);
			expect(() => aliases.assertNotManual("legacy/page", mover)).not.toThrow();
		});
	});

	describe("assertFree", () => {
		test("alias equal to an existing item's path is rejected", () => {
			const { aliases } = makeAliases([makeItem("guide/install")]);
			expect(() => aliases.assertFree("guide/install", makeItem("editing"))).toThrow(
				"equals the path of an existing item",
			);
		});

		test("alias already claimed by another item is rejected with the owner named", () => {
			const { aliases } = makeAliases([makeItem("owner", ["legacy/page"])]);
			expect(() => aliases.assertFree("legacy/page", makeItem("editing"))).toThrow("already used by 'owner'");
		});

		test("free alias passes; the edited item's own claim is not a conflict", () => {
			const editing = makeItem("editing", ["legacy/page"]);
			const { aliases } = makeAliases([editing, makeItem("bystander")]);
			expect(() => aliases.assertFree("legacy/page", editing)).not.toThrow();
			expect(() => aliases.assertFree("brand/new", editing)).not.toThrow();
		});
	});

	describe("stealAuto", () => {
		test("drops the auto claim from previous holders and persists them", async () => {
			const previous = makeItem("previous", [{ path: "legacy/page", moved: "2026-01-01T00:00:00Z" }]);
			const newOwner = makeItem("new-owner");
			const { aliases } = makeAliases([previous, newOwner]);

			await aliases.stealAuto("legacy/page", newOwner);

			expect(previous.props.aliases).toBeUndefined();
			expect(previous.save).toHaveBeenCalled();
		});

		test("manual claims survive and unaffected items are not saved", async () => {
			const manualHolder = makeItem("manual-holder", ["legacy/page"]);
			const unrelated = makeItem("unrelated", [{ path: "other", moved: "2026-01-01T00:00:00Z" }]);
			const { aliases } = makeAliases([manualHolder, unrelated]);

			await aliases.stealAuto("legacy/page", makeItem("new-owner"));

			expect(manualHolder.props.aliases).toEqual(["legacy/page"]);
			expect(manualHolder.save).not.toHaveBeenCalled();
			expect(unrelated.save).not.toHaveBeenCalled();
		});
	});

	describe("dropConflicting", () => {
		test("removes aliases that collide with existing paths or claims after a cross-catalog move", async () => {
			const arrival = makeItem("arrival", [
				"guide/install", // collides with a real item path
				{ path: "claimed", moved: "2026-01-01T00:00:00Z" }, // claimed by another item
				"arrival", // equals the item's own new path
				{ path: "keep-me", moved: "2026-01-01T00:00:00Z" },
			]);
			const { aliases, searcher } = makeAliases([
				arrival,
				makeItem("guide/install"),
				makeItem("claimant", ["claimed"]),
			]);

			await aliases.dropConflicting(arrival);

			expect(arrival.props.aliases).toEqual([{ path: "keep-me", moved: "2026-01-01T00:00:00Z" }]);
			expect(arrival.save).toHaveBeenCalled();
			expect(searcher.resetCache).toHaveBeenCalled();
		});

		test("deletes the aliases prop entirely when every entry conflicts", async () => {
			const arrival = makeItem("arrival", ["guide/install"]);
			const { aliases } = makeAliases([arrival, makeItem("guide/install")]);

			await aliases.dropConflicting(arrival);

			expect(arrival.props.aliases).toBeUndefined();
			expect(arrival.save).toHaveBeenCalled();
		});

		test("no conflicts means no save and no cache reset", async () => {
			const arrival = makeItem("arrival", ["unique/alias"]);
			const { aliases, searcher } = makeAliases([arrival, makeItem("bystander")]);

			await aliases.dropConflicting(arrival);

			expect(arrival.props.aliases).toEqual(["unique/alias"]);
			expect(arrival.save).not.toHaveBeenCalled();
			expect(searcher.resetCache).not.toHaveBeenCalled();
		});
	});

	describe("lookup", () => {
		test("findArticle resolves through the alias index and returns the canonical item", () => {
			const owner = makeItem("guide/install", [{ path: "install", moved: "2026-01-01T00:00:00Z" }]);
			const { aliases, searcher } = makeAliases([owner]);

			expect(aliases.findArticle("root/install")).toBe(owner);
			// root defaults to the catalog root category when the caller passes none
			expect(searcher.findItemByLogicPath).toHaveBeenCalledWith({ logicPath: "root" }, "root/guide/install", []);
		});

		test("path that nothing aliases resolves to null", () => {
			const { aliases } = makeAliases([makeItem("guide/install")]);
			expect(aliases.findArticle("root/never-existed")).toBeNull();
		});

		test("diagnostics come from the same index as lookups", () => {
			// alias equal to the owner's own path is the self-alias diagnostic
			const { aliases } = makeAliases([makeItem("guide", ["guide"])]);
			expect(aliases.diagnostics()).toEqual([{ kind: "self-alias", owner: "root/guide", path: "root/guide" }]);
		});

		test("invalidate makes the next lookup see fresh item props", () => {
			const owner = makeItem("guide/install");
			const { aliases } = makeAliases([owner]);

			expect(aliases.findArticle("root/install")).toBeNull();
			owner.props.aliases = ["install"];
			expect(aliases.findArticle("root/install")).toBeNull();

			aliases.invalidate();
			expect(aliases.findArticle("root/install")).toBe(owner);
		});
	});
});
