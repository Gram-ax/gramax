import { createEventEmitter } from "@core/Event/EventEmitter";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type ResourceManager from "@core/Resource/ResourceManager";
import type { ResourceManagerEvents } from "@core/Resource/ResourceManager";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { Buffer } from "buffer";
import GitLfsLazyResourceLoader from "./GitLfsLazyResourceLoader";

const POINTER = Buffer.from(
	"version https://git-lfs.github.com/spec/v1\noid sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\nsize 12345\n",
);

const makeDeferred = () => {
	let resolve!: () => void;
	let reject!: (e: Error) => void;
	const promise = new Promise<void>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

describe("GitLfsLazyResourceLoader race condition", () => {
	const originalToken = process.env.AUTO_PULL_TOKEN;
	let events: ReturnType<typeof createEventEmitter<ResourceManagerEvents>>;
	let pullCalls: Array<{
		paths: string[];
		checkout: boolean;
		scope?: TreeReadScope;
		deferred: ReturnType<typeof makeDeferred>;
	}>;
	let resourceManager: ResourceManager;
	let catalog: BaseCatalog;
	let rp: RepositoryProvider;

	beforeEach(() => {
		jest.useFakeTimers();
		process.env.AUTO_PULL_TOKEN = "auto-token";

		events = createEventEmitter<ResourceManagerEvents>();
		pullCalls = [];

		const pullLfsObjects = jest.fn(
			(_data: GitSourceData, paths: Path[], checkout: boolean, scope?: TreeReadScope) => {
				const deferred = makeDeferred();
				pullCalls.push({ paths: paths.map((p) => p.value), checkout, scope, deferred });
				return deferred.promise;
			},
		);

		resourceManager = {
			events,
			rootPath: undefined,
		} as never;

		catalog = {
			repo: {
				gvc: { pullLfsObjects },
				storage: { getSourceName: async () => "origin", getType: async () => SourceType.git },
				path: new Path("/repo"),
			},
			deref: { isFpReadOnly: true },
		} as never;

		rp = {
			getSourceData: (_ctx: object, _name: string) => ({ token: "tok" }) as GitSourceData,
		} as never;
	});

	afterEach(() => {
		jest.useRealTimers();
		process.env.AUTO_PULL_TOKEN = originalToken;
	});

	const emit = (pathValue: string) =>
		events.emit("content-read", {
			path: new Path(pathValue),
			ctx: { user: { isLogged: true } } as never,
			content: POINTER,
			out: { out: null },
		});

	it("does not drop paths added while a batch pull is in flight", async () => {
		const loader = new GitLfsLazyResourceLoader(catalog, resourceManager, rp);
		loader.mount();

		const emitA = emit("a.png");
		await jest.advanceTimersByTimeAsync(300);

		expect(pullCalls).toHaveLength(1);
		expect(pullCalls[0].paths).toEqual(["a.png"]);

		const emitB = emit("b.png");

		pullCalls[0].deferred.resolve();
		await emitA;

		await jest.advanceTimersByTimeAsync(300);

		expect(pullCalls).toHaveLength(2);
		expect(pullCalls[1].paths).toEqual(["b.png"]);

		pullCalls[1].deferred.resolve();
		await emitB;
	});

	it("batches paths that arrive within the debounce window into one pull", async () => {
		const loader = new GitLfsLazyResourceLoader(catalog, resourceManager, rp);
		loader.mount();

		const e1 = emit("a.png");
		await jest.advanceTimersByTimeAsync(100);
		const e2 = emit("b.png");
		await jest.advanceTimersByTimeAsync(100);
		const e3 = emit("c.png");
		await jest.advanceTimersByTimeAsync(300);

		expect(pullCalls).toHaveLength(1);
		expect(pullCalls[0].paths.sort()).toEqual(["a.png", "b.png", "c.png"]);

		pullCalls[0].deferred.resolve();
		await Promise.all([e1, e2, e3]);
	});

	it("pulls without scope and with checkout for a non-scoped catalog", async () => {
		const loader = new GitLfsLazyResourceLoader(catalog, resourceManager, rp);
		loader.mount();

		const emitted = emit("a.png");
		await jest.advanceTimersByTimeAsync(300);

		expect(pullCalls).toHaveLength(1);
		expect(pullCalls[0].checkout).toBe(true);
		expect(pullCalls[0].scope).toBeUndefined();

		pullCalls[0].deferred.resolve();
		await emitted;
	});

	it("uses auto-pull source data when request source data is unavailable", async () => {
		rp = {
			getSourceData: (_ctx: object, _name: string) => null,
		} as RepositoryProvider;
		const loader = new GitLfsLazyResourceLoader(catalog, resourceManager, rp);
		loader.mount();

		const emitted = emit("a.png");
		await jest.advanceTimersByTimeAsync(300);

		expect(pullCalls).toHaveLength(1);
		expect(pullCalls[0].paths).toEqual(["a.png"]);

		pullCalls[0].deferred.resolve();
		await emitted;
	});
});

describe("GitLfsLazyResourceLoader scoped catalogs", () => {
	const OLD_SHA = "a".repeat(40);
	const NEW_SHA = "b".repeat(40);

	let events: ReturnType<typeof createEventEmitter<ResourceManagerEvents>>;
	let pullCalls: Array<{
		paths: string[];
		checkout: boolean;
		scope?: TreeReadScope;
		deferred: ReturnType<typeof makeDeferred>;
	}>;
	let resourceManager: ResourceManager;
	let catalog: BaseCatalog;
	let rp: RepositoryProvider;

	const makeMountFp = (...shas: string[]) => {
		const fp = new MountFileProvider(Path.empty);
		fp.mount(Path.empty, { isReadOnly: false, withMountPath: () => {} } as never);
		for (const sha of shas) {
			const git = { repoPath: new Path("docs"), absoluteRepoPath: new Path("/ws/docs") } as never;
			fp.mount(new Path(`docs:commit-${sha}`), new GitTreeFileProvider(git));
		}
		return fp;
	};

	beforeEach(() => {
		jest.useFakeTimers();

		events = createEventEmitter<ResourceManagerEvents>();
		pullCalls = [];

		const pullLfsObjects = jest.fn(
			(_data: GitSourceData, paths: Path[], checkout: boolean, scope?: TreeReadScope) => {
				const deferred = makeDeferred();
				pullCalls.push({ paths: paths.map((p) => p.value), checkout, scope, deferred });
				return deferred.promise;
			},
		);

		resourceManager = {
			events,
			rootPath: undefined,
		} as never;

		catalog = {
			repo: {
				gvc: { pullLfsObjects },
				storage: { getSourceName: async () => "origin", getType: async () => SourceType.git },
				path: new Path("docs"),
			},
			deref: { isFpReadOnly: true },
		} as never;

		rp = {
			getSourceData: (_ctx: object, _name: string) => ({ token: "tok" }) as GitSourceData,
		} as never;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const emit = (pathValue: string) =>
		events.emit("content-read", {
			path: new Path(pathValue),
			ctx: { user: { isLogged: true } } as never,
			content: POINTER,
			out: { out: null },
		});

	it("pulls tree-relative paths with the native scope and no checkout", async () => {
		const loader = new GitLfsLazyResourceLoader(catalog, resourceManager, rp, makeMountFp(OLD_SHA));
		loader.mount();

		const emitted = emit(`docs:commit-${OLD_SHA}/imgs/a.png`);
		await jest.advanceTimersByTimeAsync(300);

		expect(pullCalls).toHaveLength(1);
		expect(pullCalls[0].paths).toEqual(["imgs/a.png"]);
		expect(pullCalls[0].checkout).toBe(false);
		expect(pullCalls[0].scope).toEqual({ commit: OLD_SHA });

		pullCalls[0].deferred.resolve();
		await emitted;
	});

	it("joins the emitted path onto resourceManager.rootPath before resolving the scope", async () => {
		resourceManager = {
			events,
			rootPath: new Path(`docs:commit-${OLD_SHA}`),
		} as never;

		const loader = new GitLfsLazyResourceLoader(catalog, resourceManager, rp, makeMountFp(OLD_SHA));
		loader.mount();

		const emitted = emit("imgs/a.png");
		await jest.advanceTimersByTimeAsync(300);

		expect(pullCalls).toHaveLength(1);
		expect(pullCalls[0].paths).toEqual(["imgs/a.png"]);
		expect(pullCalls[0].scope).toEqual({ commit: OLD_SHA });

		pullCalls[0].deferred.resolve();
		await emitted;
	});

	it("does not mix paths from different scopes in one batch", async () => {
		const loader = new GitLfsLazyResourceLoader(catalog, resourceManager, rp, makeMountFp(OLD_SHA, NEW_SHA));
		loader.mount();

		const emittedOld = emit(`docs:commit-${OLD_SHA}/a.png`);
		const emittedNew = emit(`docs:commit-${NEW_SHA}/b.png`);
		await jest.advanceTimersByTimeAsync(300);

		expect(pullCalls).toHaveLength(2);
		expect(pullCalls[0].paths).toEqual(["a.png"]);
		expect(pullCalls[0].scope).toEqual({ commit: OLD_SHA });
		expect(pullCalls[1].paths).toEqual(["b.png"]);
		expect(pullCalls[1].scope).toEqual({ commit: NEW_SHA });

		pullCalls[0].deferred.resolve();
		pullCalls[1].deferred.resolve();
		await Promise.all([emittedOld, emittedNew]);
	});

	it("falls back to the plain repo-relative pull when the path is not under a git tree mount", async () => {
		const loader = new GitLfsLazyResourceLoader(catalog, resourceManager, rp, makeMountFp(OLD_SHA));
		loader.mount();

		const emitted = emit("docs/imgs/a.png");
		await jest.advanceTimersByTimeAsync(300);

		expect(pullCalls).toHaveLength(1);
		expect(pullCalls[0].scope).toBeUndefined();
		expect(pullCalls[0].checkout).toBe(true);

		pullCalls[0].deferred.resolve();
		await emitted;
	});
});
