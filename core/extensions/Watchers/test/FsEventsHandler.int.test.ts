import TestContext from "@app/test/TestContext";
import type Application from "@app/types/Application";
import getApp from "@app/web/app";
import type Context from "@core/Context/Context";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { EMPTY_FS_HANDLE_RESULT, handleFsEvents } from "@ext/Watchers/FsEventsHandler";
import { PendingSelfWrites } from "@ext/Watchers/PendingSelfWrites";
import type { Workspace } from "@ext/workspace/Workspace";
import { writeFileSync } from "fs";
import { resolve } from "path";

process.env.ROOT_PATH = resolve(__dirname, "FsEventsHandler_tests");
const p = (s: string) => new Path(s);
const dfp = new DiskFileProvider(p(process.env.ROOT_PATH));

const catalogRoot = (title: string) => `title: ${title}\nurl: ${title}\n`;
const article = (title: string, body = "body") => `---\ntitle: ${title}\n---\n\n${body}`;
const articleWithProps = (title: string, props: string, body = "body") =>
	`---\ntitle: ${title}\n${props}\n---\n\n${body}`;

let app: Application;

const setupApp = async (): Promise<Application> => {
	delete global.app;
	delete global.commands;
	delete global.config;
	app = await getApp();
	return app;
};

const collectRefPaths = (links: { ref?: { path?: string }; items?: unknown[] }[]): string[] => {
	const out: string[] = [];
	const walk = (nodes: typeof links) => {
		for (const n of nodes) {
			if (n.ref?.path) out.push(n.ref.path);
			if (Array.isArray(n.items)) walk(n.items as typeof links);
		}
	};
	walk(links);
	return out;
};

describe("FsEventsHandler", () => {
	beforeAll(async () => {
		await dfp.delete(p("."));
		await dfp.write(p("notes/.doc-root.yaml"), catalogRoot("notes"));
		await dfp.write(p("notes/keep.md"), article("Keep"));
		await dfp.write(p("notes/doomed.md"), article("Doomed"));
		await dfp.write(p("notes/section/_index.md"), article("Section"));
		await dfp.write(p("notes/section/inside.md"), article("Inside"));
	});

	afterAll(async () => {
		await dfp.delete(p("."));
		delete global.app;
		delete global.commands;
		delete global.config;
	});

	beforeEach(() => {
		PendingSelfWrites.clearAll();
	});

	test("removed .md triggers nav refresh and itemLinks omits the article", async () => {
		await setupApp();

		await dfp.delete(p("notes/doomed.md"));
		PendingSelfWrites.clearAll(); // simulate an EXTERNAL delete (no self-write mark)
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/doomed.md", kind: { type: "removed" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);
		expect(result.itemLinks).not.toBeNull();
		const paths = collectRefPaths(result.itemLinks ?? []);
		expect(paths).toContain("notes/keep.md");
		expect(paths).not.toContain("notes/doomed.md");
	});

	test("created .md triggers nav refresh", async () => {
		await setupApp();

		await dfp.write(p("notes/new-one.md"), article("NewOne"));
		PendingSelfWrites.clearAll();
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/new-one.md", kind: { type: "created" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);
		const paths = collectRefPaths(result.itemLinks ?? []);
		expect(paths).toContain("notes/new-one.md");

		await dfp.delete(p("notes/new-one.md"));
	});

	test("non-md created file triggers nav refresh", async () => {
		await setupApp();

		await dfp.write(p("notes/image.png"), "binary");
		PendingSelfWrites.clearAll();
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/image.png", kind: { type: "created" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);

		await dfp.delete(p("notes/image.png"));
	});

	test("event outside catalog basePath is ignored", async () => {
		await setupApp();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "other-cat/x.md", kind: { type: "removed" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.itemLinks).toBeNull();
	});

	test("event in prefix-similar catalog name is ignored (boundary check)", async () => {
		await setupApp();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notesextra/x.md", kind: { type: "created" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.itemLinks).toBeNull();
	});

	test("modified .md does NOT trigger nav refresh; reports changed article", async () => {
		await setupApp();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/keep.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.itemLinks).toBeNull();
		expect(result.changedArticles).toContain("notes/keep.md");
	});

	test("modified self-write is skipped (no double-processing)", async () => {
		await setupApp();

		await dfp.write(p("notes/keep.md"), article("Keep edited"));
		// dfp.write marks self-write — handleFsEvents should skip
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/keep.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);
	});

	test("self-write echo on the ACTIVE article is ignored (reload would reset the cursor)", async () => {
		await setupApp();

		await dfp.write(p("notes/keep.md"), article("Keep saved by app"));
		// The watcher echo of our own save must not reload the editor: that resets
		// focus/cursor and rolls back keystrokes typed since the save.
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			currentPath: "notes/keep.md",
			events: [{ relPath: "notes/keep.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);
	});

	test("external edit inside the self-write window is suppressed (accepted tradeoff)", async () => {
		await setupApp();

		await dfp.write(p("notes/keep.md"), article("Keep saved by app"));
		// External editor overwrites the file right after our save, inside the mark TTL.
		// Detecting this would require reading the file back and byte-comparing with the
		// last self-write — deliberately dropped to avoid extra disk reads. The edit
		// surfaces on the next event after the 10s window.
		writeFileSync(resolve(process.env.ROOT_PATH, "notes/keep.md"), article("Keep edited externally"));
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			currentPath: "notes/keep.md",
			events: [{ relPath: "notes/keep.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);
	});

	test("self-write modified on a NON-active article is still skipped", async () => {
		await setupApp();

		await dfp.write(p("notes/keep.md"), article("Keep edited"));
		// A different article is open, so keep.md's self-write echo must stay suppressed.
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			currentPath: "notes/section/inside.md",
			events: [{ relPath: "notes/keep.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);
	});

	test("duplicate created+modified events for one self-write are both skipped (FSEvents sticky flags)", async () => {
		await setupApp();

		await dfp.write(p("notes/keep.md"), article("Keep edited twice"));
		// One in-app save can surface as several watcher events for the same path; the
		// self-write mark must suppress all of them, not just the first.
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [
				{ relPath: "notes/keep.md", kind: { type: "created" } },
				{ relPath: "notes/keep.md", kind: { type: "modified" } },
				{ relPath: "notes/keep.md", kind: { type: "modified" } },
			],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);
	});

	test("created self-write on known article is skipped (macOS FSEvents quirk)", async () => {
		await setupApp();

		await dfp.write(p("notes/keep.md"), article("Keep edited again"));
		// macOS FSEvents may emit `created` for an in-place write to an existing file; the
		// catalog already knows the path so the self-write mark should still apply.
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/keep.md", kind: { type: "created" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);
	});

	test("created event for unknown article still triggers nav refresh", async () => {
		await setupApp();

		await dfp.write(p("notes/fresh.md"), article("Fresh"));
		PendingSelfWrites.clearAll();
		// catalog hasn't been reloaded yet, so the article is not yet known — must refresh.
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/fresh.md", kind: { type: "created" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);
		const paths = collectRefPaths(result.itemLinks ?? []);
		expect(paths).toContain("notes/fresh.md");

		await dfp.delete(p("notes/fresh.md"));
	});

	test("modified event for non-existent file triggers nav refresh (Finder-delete quirk)", async () => {
		await setupApp();

		await dfp.write(p("notes/ghost.md"), article("Ghost"));
		await dfp.delete(p("notes/ghost.md"));
		PendingSelfWrites.clearAll();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/ghost.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);
		const paths = collectRefPaths(result.itemLinks ?? []);
		expect(paths).not.toContain("notes/ghost.md");
	});

	test("external content-only edit of _index.md patches without nav re-scan", async () => {
		await setupApp();

		await dfp.write(p("notes/section/_index.md"), article("Section", "updated body"));
		PendingSelfWrites.clearAll(); // external edit

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/section/_index.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.itemLinks).toBeNull();
		expect(result.changedArticles).toContain("notes/section/_index.md");
	});

	test("external edit of _index_en.md (localized index) patches without nav re-scan", async () => {
		await setupApp();

		await dfp.write(p("notes/section/_index_en.md"), article("Section en"));
		PendingSelfWrites.clearAll();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/section/_index_en.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);

		await dfp.delete(p("notes/section/_index_en.md"));
	});

	test("self-write on _index.md is ignored (typing into a category must not re-scan)", async () => {
		await setupApp();

		await dfp.write(p("notes/section/_index.md"), article("Section", "typed in app"));
		// dfp.write marks the self-write; a category autosave must be suppressed like any other,
		// the old structural-file exemption is what reset the editor and lost keystrokes.
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/section/_index.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);
	});

	test("self-write on .doc-root.yaml is ignored", async () => {
		await setupApp();

		await dfp.write(p("notes/.doc-root.yaml"), catalogRoot("notes"));
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/.doc-root.yaml", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);
	});

	test("in-app category delete: child events under the marked directory are ignored", async () => {
		await setupApp();

		await dfp.write(p("notes/gone/_index.md"), article("Gone"));
		await dfp.write(p("notes/gone/inner.md"), article("Inner"));
		PendingSelfWrites.clearAll();
		await dfp.delete(p("notes/gone")); // marks only the directory path

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [
				{ relPath: "notes/gone", kind: { type: "removed" } },
				{ relPath: "notes/gone/_index.md", kind: { type: "removed" } },
				{ relPath: "notes/gone/inner.md", kind: { type: "removed" } },
			],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.itemLinks).toBeNull();
	});

	test("in-app move of a whole section: every child rename echo is ignored", async () => {
		await setupApp();

		await dfp.write(p("notes/movesrc/_index.md"), article("MoveSrc"));
		await dfp.write(p("notes/movesrc/one.md"), article("One"));
		await dfp.write(p("notes/movesrc/two.md"), article("Two"));
		PendingSelfWrites.clearAll();
		await dfp.move(p("notes/movesrc"), p("notes/movedst")); // marks the from+to directory paths only

		// The watcher echoes a rename per moved node. None of the children are marked directly —
		// they must be covered by the marked parent directory (PendingSelfWrites.covers walk).
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [
				{ relPath: "notes/movedst", kind: { type: "renamed", from: "notes/movesrc" } },
				{ relPath: "notes/movedst/_index.md", kind: { type: "renamed", from: "notes/movesrc/_index.md" } },
				{ relPath: "notes/movedst/one.md", kind: { type: "renamed", from: "notes/movesrc/one.md" } },
				{ relPath: "notes/movedst/two.md", kind: { type: "renamed", from: "notes/movesrc/two.md" } },
			],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.itemLinks).toBeNull();

		await dfp.delete(p("notes/movedst"));
	});

	test("external modified on a non-md file is ignored (no owner mapping)", async () => {
		await setupApp();

		await dfp.write(p("notes/random.bin"), "bytes");
		PendingSelfWrites.clearAll();
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/random.bin", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);

		await dfp.delete(p("notes/random.bin"));
	});

	test("modified .doc-root.yaml triggers nav refresh (catalog root metadata)", async () => {
		await setupApp();

		await dfp.write(p("notes/.doc-root.yaml"), catalogRoot("notes-renamed"));
		PendingSelfWrites.clearAll();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/.doc-root.yaml", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);

		await dfp.write(p("notes/.doc-root.yaml"), catalogRoot("notes"));
	});

	test("removed self-write is suppressed (in-app delete already refreshed nav)", async () => {
		await setupApp();

		await dfp.write(p("notes/throwaway.md"), article("Throw"));
		await dfp.delete(p("notes/throwaway.md"));
		// dfp.delete marks self-write. An in-app delete refreshes nav through its own command flow
		// (removeItem → refreshPage), so the watcher echo must NOT trigger a second full re-scan —
		// that redundant rebuild on every structural self-write is what made drag-n-drop janky.
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/throwaway.md", kind: { type: "removed" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.itemLinks).toBeNull();
	});

	test("renamed self-write is suppressed (in-app drag-reorder already refreshed nav)", async () => {
		await setupApp();

		await dfp.write(p("notes/moved.md"), article("Moved"));
		await dfp.move(p("notes/moved.md"), p("notes/section/moved.md"));
		// dfp.move marks both from+to as self-writes. A drag-reorder persists via updateCatalogNav
		// which already returns the fresh nav, so the watcher rename echo must be suppressed.
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/section/moved.md", kind: { type: "renamed", from: "notes/moved.md" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.itemLinks).toBeNull();

		await dfp.delete(p("notes/section/moved.md"));
	});

	test("renamed EXTERNAL (unmarked) triggers nav refresh", async () => {
		await setupApp();

		await dfp.write(p("notes/ext-from.md"), article("ExtFrom"));
		await dfp.move(p("notes/ext-from.md"), p("notes/ext-to.md"));
		PendingSelfWrites.clearAll(); // simulate an external move (e.g. git pull / editor)
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/ext-to.md", kind: { type: "renamed", from: "notes/ext-from.md" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);
		const paths = collectRefPaths(result.itemLinks ?? []);
		expect(paths).toContain("notes/ext-to.md");
		expect(paths).not.toContain("notes/ext-from.md");

		await dfp.delete(p("notes/ext-to.md"));
	});

	test("external _index.md edit reloads category content (patch is not a no-op)", async () => {
		await setupApp();

		await dfp.write(p("notes/section/_index.md"), article("Section", "fresh category body"));
		PendingSelfWrites.clearAll();

		await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/section/_index.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		const catalog = await app.wm.maybeCurrent()?.getContextlessCatalog("notes");
		const category = catalog?.findItemByItemPath<Article>(p("notes/section/_index.md"));
		expect(await category?.getContent()).toContain("fresh category body");
	});

	test("external order change escalates patch to nav re-scan", async () => {
		await setupApp();
		// Catalog loads lazily on first access — force the scan BEFORE the external write,
		// otherwise the initial scan already sees the new order and prev === next.
		await app.wm.maybeCurrent()?.getContextlessCatalog("notes");

		await dfp.write(p("notes/keep.md"), articleWithProps("Keep", "order: 42"));
		PendingSelfWrites.clearAll();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/keep.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);
		expect(result.itemLinks).not.toBeNull();
		expect(result.changedArticles).toContain("notes/keep.md");

		await dfp.write(p("notes/keep.md"), article("Keep"));
	});

	test("external hidden change escalates patch to nav re-scan", async () => {
		await setupApp();
		// See order test above: force the lazy catalog scan before the external write.
		await app.wm.maybeCurrent()?.getContextlessCatalog("notes");

		await dfp.write(p("notes/keep.md"), articleWithProps("Keep", "hidden: true"));
		PendingSelfWrites.clearAll();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/keep.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);

		await dfp.write(p("notes/keep.md"), article("Keep"));
	});

	test("external title-only change does NOT escalate (patched via modifiedArticleProps)", async () => {
		await setupApp();

		await dfp.write(p("notes/keep.md"), article("Keep Retitled"));
		PendingSelfWrites.clearAll();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			events: [{ relPath: "notes/keep.md", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.modifiedArticleProps).toEqual([{ path: "notes/keep.md", props: { title: "Keep Retitled" } }]);

		await dfp.write(p("notes/keep.md"), article("Keep"));
	});

	test("modified resource of the parsed CURRENT article refreshes it", async () => {
		await setupApp();

		await dfp.write(p("notes/pic.png"), "png-bytes-v1");
		await dfp.write(p("notes/keep.md"), article("Keep", "![img](./pic.png)"));
		PendingSelfWrites.clearAll();
		await setupApp(); // re-scan so keep.md picks up the resource link

		// Parse the article so its ResourceManager knows about ./pic.png.
		const workspace = app.wm.maybeCurrent();
		const catalog = await workspace?.getContextlessCatalog("notes");
		const item = catalog?.findItemByItemPath(p("notes/keep.md"));
		await parseContent(item as never, catalog as never, new TestContext(), app.parser, app.parserContextFactory);

		await dfp.write(p("notes/pic.png"), "png-bytes-v2");
		PendingSelfWrites.clearAll();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			currentPath: "notes/keep.md",
			events: [{ relPath: "notes/pic.png", kind: { type: "modified" } }],
			workspace,
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toContain("notes/keep.md");

		await dfp.delete(p("notes/pic.png"));
		await dfp.write(p("notes/keep.md"), article("Keep"));
	});

	test("modified resource with a DIFFERENT article open is ignored", async () => {
		await setupApp();

		await dfp.write(p("notes/pic2.png"), "bytes");
		PendingSelfWrites.clearAll();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			currentPath: "notes/section/inside.md",
			events: [{ relPath: "notes/pic2.png", kind: { type: "modified" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toEqual([]);

		await dfp.delete(p("notes/pic2.png"));
	});

	test("weird resource path in the current article does not abort the batch", async () => {
		await setupApp();

		await dfp.write(p("notes/pic3.png"), "bytes");
		await dfp.write(p("notes/keep.md"), article("Keep", "![img](./bad%zz.png)"));
		PendingSelfWrites.clearAll();
		await setupApp(); // re-scan so keep.md picks up the resource link

		const workspace = app.wm.maybeCurrent();
		const catalog = await workspace?.getContextlessCatalog("notes");
		const item = catalog?.findItemByItemPath(p("notes/keep.md"));
		await parseContent(item as never, catalog as never, new TestContext(), app.parser, app.parserContextFactory);

		await dfp.write(p("notes/pic3.png"), "bytes-v2");
		await dfp.write(p("notes/section/inside.md"), article("Inside", "updated body"));
		PendingSelfWrites.clearAll();

		// The png event walks the current article's resources (including the odd entry);
		// the .md event must still land even if that walk misbehaves.
		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			currentPath: "notes/keep.md",
			events: [
				{ relPath: "notes/pic3.png", kind: { type: "modified" } },
				{ relPath: "notes/section/inside.md", kind: { type: "modified" } },
			],
			workspace,
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(false);
		expect(result.changedArticles).toContain("notes/section/inside.md");

		await dfp.delete(p("notes/pic3.png"));
		await dfp.write(p("notes/keep.md"), article("Keep"));
		await dfp.write(p("notes/section/inside.md"), article("Inside"));
	});

	test("external rename of the ACTIVE article redirects to its new path", async () => {
		await setupApp();

		await dfp.write(p("notes/open-old.md"), article("Open"));
		await setupApp(); // catalog must know the article before the rename

		await dfp.move(p("notes/open-old.md"), p("notes/open-new.md"));
		PendingSelfWrites.clearAll(); // external move

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			currentPath: "notes/open-old.md",
			events: [{ relPath: "notes/open-new.md", kind: { type: "renamed", from: "notes/open-old.md" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);
		expect(result.currentArticleRedirectTo).toContain("open-new");

		await dfp.delete(p("notes/open-new.md"));
	});

	test("external rename of an ANCESTOR directory redirects to the nearest living parent", async () => {
		await setupApp();

		await dfp.move(p("notes/section"), p("notes/chapter"));
		PendingSelfWrites.clearAll();

		const result = await handleFsEvents({
			ctx: new TestContext(),
			catalogName: "notes",
			currentPath: "notes/section/inside.md",
			events: [{ relPath: "notes/chapter", kind: { type: "renamed", from: "notes/section" } }],
			workspace: app.wm.maybeCurrent(),
			sitePresenterFactory: app.sitePresenterFactory,
		});

		expect(result.navChanged).toBe(true);
		expect(result.currentArticleRedirectTo).not.toBeNull();
		expect(result.currentArticleRedirectTo).not.toContain("section/inside");

		await dfp.move(p("notes/chapter"), p("notes/section"));
	});
});

// Guard-level test with a mocked workspace: forcing a real repo into checkout/syncing is
// impractical in the disk fixture above, so the bulk-command skip is verified here in isolation.
describe("FsEventsHandler repository-state guard", () => {
	test.each(["checkout", "syncing"])("skips watcher events while repository state is %s", async (state) => {
		const workspace = {
			getContextlessCatalog: jest.fn(async () => ({
				repo: {
					getState: jest.fn(async () => ({ inner: { value: state } })),
				},
			})),
			getFileProvider: jest.fn(() => {
				throw new Error("file provider should not be requested during checkout");
			}),
		} as unknown as Workspace;

		const result = await handleFsEvents({
			ctx: {} as Context,
			catalogName: "notes",
			events: [{ relPath: "notes/new-during-checkout.md", kind: { type: "created" } }],
			workspace,
			sitePresenterFactory: {} as never,
		});

		expect(result).toEqual(EMPTY_FS_HANDLE_RESULT);
		expect(workspace.getContextlessCatalog).toHaveBeenCalledWith("notes");
		expect(workspace.getFileProvider).not.toHaveBeenCalled();
	});
});
