import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import DiskFileProvider from "./DiskFileProvider/DiskFileProvider";
import { resolveResourceReadSource } from "./ResourceReadSource";

describe("resolveResourceReadSource", () => {
	it("builds a Git tree read source for a bare repository resource", () => {
		const scope = { kind: "git", repo: "/data/catalog.git", scope: null } as never;
		const gitProvider = new GitTreeFileProvider({} as never);
		const getNativeScope = jest
			.spyOn(gitProvider, "getNativeScope")
			.mockReturnValue({ scope, scopedPath: "manual.pdf" });
		const fp = gitProvider as unknown as FileProvider;

		expect(resolveResourceReadSource(fp, [new Path("/data/catalog/manual.pdf")])).toEqual({
			targets: [{ kind: "git", scope, path: "manual.pdf" }],
		});
		expect(getNativeScope).toHaveBeenCalledWith(new Path("/data/catalog/manual.pdf"));
	});

	it("does not use a structural getNativeScope method as a Git tree provider", () => {
		const getNativeScope = jest.fn();
		const fp = { kind: "git", getNativeScope } as unknown as FileProvider;

		expect(resolveResourceReadSource(fp, [new Path("/data/catalog/manual.pdf")])).toEqual({
			targets: [{ kind: "disk", path: "/data/catalog/manual.pdf" }],
		});
		expect(getNativeScope).not.toHaveBeenCalled();
	});

	it("builds an absolute disk source for a worker", () => {
		const fp = new DiskFileProvider(new Path("/data/workspace"));

		expect(resolveResourceReadSource(fp, [new Path("catalog/manual.pdf")])).toEqual({
			targets: [{ kind: "disk", path: "/data/workspace/catalog/manual.pdf" }],
		});
	});
});
