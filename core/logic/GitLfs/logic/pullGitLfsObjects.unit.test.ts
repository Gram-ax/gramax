import Path from "@core/FileProvider/Path/Path";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { pullGitLfsObjects } from "./pullGitLfsObjects";

describe("pullGitLfsObjects", () => {
	const makeCatalog = (pullLfsObjects: jest.Mock) =>
		({
			repo: {
				gvc: { pullLfsObjects },
				path: new Path("/repo"),
				storage: {
					getSourceName: jest.fn().mockResolvedValue("origin"),
					getType: jest.fn().mockResolvedValue(SourceType.git),
				},
			},
			deref: { isFpReadOnly: false },
		}) as never;

	it("pulls repo-relative paths using request source data", async () => {
		const pullLfsObjects = jest.fn().mockResolvedValue(undefined);
		const getSourceData = jest.fn().mockReturnValue({ token: "tok" } as GitSourceData);

		await pullGitLfsObjects({
			catalog: makeCatalog(pullLfsObjects),
			ctx: { user: { isLogged: true } } as never,
			paths: [new Path("assets/logo.png")],
			rp: { getSourceData } as never,
		});

		expect(getSourceData).toHaveBeenCalledWith({ user: { isLogged: true } }, "origin");
		expect(pullLfsObjects).toHaveBeenCalledWith({ token: "tok" }, [new Path("assets/logo.png")], true, undefined);
	});

	it("passes scope through and disables checkout for scoped pulls", async () => {
		const pullLfsObjects = jest.fn().mockResolvedValue(undefined);
		const getSourceData = jest.fn().mockReturnValue({ token: "tok" } as GitSourceData);

		await pullGitLfsObjects({
			catalog: makeCatalog(pullLfsObjects),
			ctx: { user: { isLogged: true } } as never,
			paths: [new Path("assets/logo.png")],
			rp: { getSourceData } as never,
			scope: { commit: "abc123" },
		});

		expect(pullLfsObjects).toHaveBeenCalledWith({ token: "tok" }, [new Path("assets/logo.png")], false, {
			commit: "abc123",
		});
	});

	it("treats HEAD scope as an unscoped pull", async () => {
		const pullLfsObjects = jest.fn().mockResolvedValue(undefined);
		const getSourceData = jest.fn().mockReturnValue({ token: "tok" } as GitSourceData);

		await pullGitLfsObjects({
			catalog: makeCatalog(pullLfsObjects),
			ctx: { user: { isLogged: true } } as never,
			paths: [new Path("assets/logo.png")],
			rp: { getSourceData } as never,
			scope: "HEAD",
		});

		expect(pullLfsObjects).toHaveBeenCalledWith({ token: "tok" }, [new Path("assets/logo.png")], true, undefined);
	});
});
