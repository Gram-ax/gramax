import Path from "@core/FileProvider/Path/Path";
import { Buffer } from "buffer";
import { pullLfsResourceIfPointer } from "./pullLfsResourceIfPointer";
import { resolveLfsPullTarget } from "./resolveLfsPullTarget";

jest.mock("./resolveLfsPullTarget", () => ({ resolveLfsPullTarget: jest.fn() }));
jest.mock("./pullGitLfsObjects", () => ({
	pullGitLfsObjects: jest.fn().mockResolvedValue(true),
	toRepoRelativeLfsPath: jest.fn((_catalog: unknown, p: Path) => p),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pullGitLfsObjects } = require("./pullGitLfsObjects");

const POINTER = Buffer.from(
	"version https://git-lfs.github.com/spec/v1\noid sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\nsize 12345\n",
);

const makeFp = (stat: { size: number } | null, content: Buffer) => ({
	getStat: jest.fn(stat ? async () => stat : async () => Promise.reject(new Error("no file"))),
	readAsBinary: jest.fn(async () => content),
});

const ctx = {} as never;
const rp = {} as never;
const catalog = { repo: {}, basePath: new Path("docs:commit-abc") } as never;

beforeEach(() => jest.clearAllMocks());

describe("pullLfsResourceIfPointer", () => {
	it("pulls with the tree scope regardless of the reported size, without a stat gate", async () => {
		// a GitTreeFileProvider stats an LFS pointer at its declared object size (large), yet the
		// pointer itself reads back cheaply — the size gate must not skip it
		(resolveLfsPullTarget as jest.Mock).mockReturnValue({ path: new Path("imgs/a.png"), scope: { commit: "abc" } });
		const fp = makeFp({ size: 5_000_000 }, POINTER);

		await pullLfsResourceIfPointer({
			fp: fp as never,
			catalog,
			absolutePath: new Path("docs:commit-abc/imgs/a.png"),
			ctx,
			rp,
		});

		expect(fp.getStat).not.toHaveBeenCalled();
		expect(pullGitLfsObjects).toHaveBeenCalledTimes(1);
		expect(pullGitLfsObjects.mock.calls[0][0].scope).toEqual({ commit: "abc" });
		expect(pullGitLfsObjects.mock.calls[0][0].paths[0].value).toBe("imgs/a.png");
	});

	it("skips large off-tree files without reading them", async () => {
		(resolveLfsPullTarget as jest.Mock).mockReturnValue(null);
		const fp = makeFp({ size: 5000 }, POINTER);

		await pullLfsResourceIfPointer({ fp: fp as never, catalog, absolutePath: new Path("docs/img.png"), ctx, rp });

		expect(fp.readAsBinary).not.toHaveBeenCalled();
		expect(pullGitLfsObjects).not.toHaveBeenCalled();
	});

	it("does not pull when the content is not a pointer", async () => {
		const fp = makeFp({ size: 130 }, Buffer.from("just some short text, not a pointer"));

		await pullLfsResourceIfPointer({ fp: fp as never, catalog, absolutePath: new Path("docs/a.txt"), ctx, rp });

		expect(pullGitLfsObjects).not.toHaveBeenCalled();
	});

	it("falls back to a repo-relative path when the provider has no tree scope", async () => {
		(resolveLfsPullTarget as jest.Mock).mockReturnValue(null);
		const fp = makeFp({ size: 130 }, POINTER);

		await pullLfsResourceIfPointer({
			fp: fp as never,
			catalog,
			absolutePath: new Path("docs/imgs/a.png"),
			ctx,
			rp,
		});

		expect(pullGitLfsObjects).toHaveBeenCalledTimes(1);
		expect(pullGitLfsObjects.mock.calls[0][0].scope).toBeUndefined();
	});

	it("does nothing for a catalog without a repo", async () => {
		const fp = makeFp({ size: 130 }, POINTER);

		await pullLfsResourceIfPointer({
			fp: fp as never,
			catalog: { repo: undefined, basePath: new Path("docs") } as never,
			absolutePath: new Path("docs/a.png"),
			ctx,
			rp,
		});

		expect(fp.getStat).not.toHaveBeenCalled();
		expect(pullGitLfsObjects).not.toHaveBeenCalled();
	});
});
