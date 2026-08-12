import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { type ClassifierDeps, classifyFsEvent } from "@ext/Watchers/classifyFsEvent";
import type { FsEventDto, FsEventKind } from "@ext/Watchers/FsEvent";

const BASE = "notes";

const makeCatalog = (): ClassifierDeps["catalog"] =>
	({
		toCatalogRelativePath: (path: Path) => {
			const v = path.value;
			if (v === BASE) return new Path("");
			if (v.startsWith(`${BASE}/`)) return new Path(v.slice(BASE.length + 1));
			return null;
		},
	}) as unknown as ClassifierDeps["catalog"];

const makeFp = (exists: boolean | ((rel: string) => boolean) = true): FileProvider =>
	({
		exists: async (path: Path) => (typeof exists === "function" ? exists(path.value) : exists),
	}) as unknown as FileProvider;

const ev = (relPath: string, kind: FsEventKind): FsEventDto => ({ relPath, kind });

const deps = (over: Partial<ClassifierDeps> = {}): ClassifierDeps => ({
	catalog: makeCatalog(),
	fp: makeFp(true),
	isSelfWrite: () => false,
	...over,
});

describe("classifyFsEvent", () => {
	test("ignores paths outside the catalog", async () => {
		const result = await classifyFsEvent(ev("other-cat/x.md", { type: "modified" }), deps());
		expect(result).toEqual({ type: "ignore" });
	});

	test("ignores when every catalog path is a self-write", async () => {
		const result = await classifyFsEvent(ev("notes/a.md", { type: "modified" }), deps({ isSelfWrite: () => true }));
		expect(result).toEqual({ type: "ignore" });
	});

	test.each(["created", "removed"] as const)("classifies %s as structural", async (type) => {
		const result = await classifyFsEvent(ev("notes/a.md", { type }), deps());
		expect(result).toEqual({ type: "structural" });
	});

	test("classifies a rename as structural", async () => {
		const result = await classifyFsEvent(ev("notes/b.md", { type: "renamed", from: "notes/a.md" }), deps());
		expect(result).toEqual({ type: "structural" });
	});

	test("a rename is only ignored when BOTH from and to are self-writes", async () => {
		// Only the destination is marked; the source is an external path, so the rename must not be suppressed.
		const isSelfWrite = (rel: string) => rel === "notes/b.md";
		const result = await classifyFsEvent(
			ev("notes/b.md", { type: "renamed", from: "notes/a.md" }),
			deps({ isSelfWrite }),
		);
		expect(result).toEqual({ type: "structural" });
	});

	test("a rename with both endpoints marked is ignored", async () => {
		const result = await classifyFsEvent(
			ev("notes/b.md", { type: "renamed", from: "notes/a.md" }),
			deps({ isSelfWrite: () => true }),
		);
		expect(result).toEqual({ type: "ignore" });
	});

	test("in-app section move: a child rename covered by the marked parent dirs is ignored", async () => {
		// Moving a whole section marks the from+to directories; PendingSelfWrites.covers resolves each
		// child up to its marked parent, so both endpoints of the child rename read as self-writes.
		const isSelfWrite = (rel: string) => rel.startsWith("notes/movesrc/") || rel.startsWith("notes/movedst/");
		const result = await classifyFsEvent(
			ev("notes/movedst/child.md", { type: "renamed", from: "notes/movesrc/child.md" }),
			deps({ isSelfWrite }),
		);
		expect(result).toEqual({ type: "ignore" });
	});

	test("modified .doc-root.yaml is structural (catalog root metadata)", async () => {
		const result = await classifyFsEvent(ev("notes/.doc-root.yaml", { type: "modified" }), deps());
		expect(result).toEqual({ type: "structural" });
	});

	test("modified file that no longer exists is structural (Finder-delete quirk)", async () => {
		const result = await classifyFsEvent(ev("notes/a.md", { type: "modified" }), deps({ fp: makeFp(false) }));
		expect(result).toEqual({ type: "structural" });
	});

	test("modified existing .md is a patch of that article", async () => {
		const result = await classifyFsEvent(ev("notes/a.md", { type: "modified" }), deps());
		expect(result.type).toBe("patch");
		if (result.type !== "patch") return;
		expect(result.articleRelPath).toBe("notes/a.md");
		expect(result.catalogRel.value).toBe("a.md");
	});

	test("modified non-md resource of the current article patches the current article", async () => {
		const result = await classifyFsEvent(
			ev("notes/pic.png", { type: "modified" }),
			deps({ currentArticlePath: "notes/keep.md", isCurrentArticleResource: async () => true }),
		);
		expect(result.type).toBe("patch");
		if (result.type !== "patch") return;
		expect(result.articleRelPath).toBe("notes/keep.md");
		expect(result.catalogRel.value).toBe("keep.md");
	});

	test("modified non-md that is not a resource of the current article is ignored", async () => {
		const result = await classifyFsEvent(
			ev("notes/pic.png", { type: "modified" }),
			deps({ currentArticlePath: "notes/keep.md", isCurrentArticleResource: async () => false }),
		);
		expect(result).toEqual({ type: "ignore" });
	});

	test("modified non-md with no article open is ignored", async () => {
		const result = await classifyFsEvent(ev("notes/pic.png", { type: "modified" }), deps());
		expect(result).toEqual({ type: "ignore" });
	});
});
