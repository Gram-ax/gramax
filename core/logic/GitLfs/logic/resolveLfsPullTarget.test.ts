import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { resolveLfsPullTarget } from "./resolveLfsPullTarget";

const SHA = "a".repeat(40);

const makeMountFp = (...shas: string[]) => {
	const fp = new MountFileProvider(Path.empty);
	fp.mount(Path.empty, { isReadOnly: false, withMountPath: () => {} } as never);
	for (const sha of shas) {
		const git = { repoPath: new Path("docs"), absoluteRepoPath: new Path("/ws/docs") } as never;
		fp.mount(new Path(`docs:commit-${sha}`), new GitTreeFileProvider(git));
	}
	return fp;
};

describe("resolveLfsPullTarget", () => {
	it("returns the tree-relative path and commit scope for a GitTreeFileProvider mount", () => {
		const fp = makeMountFp(SHA);

		const target = resolveLfsPullTarget(fp, new Path(`docs:commit-${SHA}/imgs/a.png`));

		expect(target?.path.value).toBe("imgs/a.png");
		expect(target?.scope).toEqual({ commit: SHA });
	});

	it("returns null when the path is not served by a git tree provider", () => {
		const fp = makeMountFp(SHA);

		expect(resolveLfsPullTarget(fp, new Path("docs/imgs/a.png"))).toBeNull();
	});

	it("returns a target without scope for a HEAD git tree mount", () => {
		const fp = new MountFileProvider(Path.empty);
		fp.mount(Path.empty, { isReadOnly: false, withMountPath: () => {} } as never);
		const git = { repoPath: new Path("docs"), absoluteRepoPath: new Path("/ws/docs") } as never;
		fp.mount(new Path("docs:HEAD"), new GitTreeFileProvider(git));

		const target = resolveLfsPullTarget(fp, new Path("docs:HEAD/imgs/a.png"));

		expect(target?.path.value).toBe("imgs/a.png");
		expect(target?.scope).toBeUndefined();
	});
});
