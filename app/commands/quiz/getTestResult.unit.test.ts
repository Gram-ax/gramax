import Path from "@core/FileProvider/Path/Path";
import getTestResult from "./getTestResult";

type GetTestResultArgs = Parameters<typeof getTestResult.do>[0];

describe("quiz/getTestResult command", () => {
	const runCommand = (gvc: { isInit: jest.Mock; getHeadCommit: jest.Mock }) => {
		const catalog = {
			findItemByItemPath: () => ({ ref: { path: { value: "a.md" } } }),
			repo: { gvc },
		};
		const workspace = {
			config: async () => ({ enterprise: { gesUrl: "https://ges", modules: { quiz: true } } }),
			getCatalog: async () => catalog,
		};

		Reflect.set(getTestResult, "_app", { wm: { current: () => workspace } });

		return getTestResult.do({
			ctx: {} as unknown as GetTestResultArgs["ctx"],
			catalogName: "new-catalog-2",
			articlePath: new Path("a.md"),
		});
	};

	it("returns null without calling getHeadCommit when the repo is not initialized", async () => {
		const isInit = jest.fn().mockResolvedValue(false);
		const getHeadCommit = jest.fn().mockRejectedValue(new Error("could not find repository"));

		await expect(runCommand({ isInit, getHeadCommit })).resolves.toBeNull();
		expect(isInit).toHaveBeenCalled();
		expect(getHeadCommit).not.toHaveBeenCalled();
	});
});
