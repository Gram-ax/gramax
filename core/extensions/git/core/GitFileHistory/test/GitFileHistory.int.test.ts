/**
 * @jest-environment node
 */
import getApp from "@app/node/app";
import DiskFileProvider from "../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { TEST_GIT_CATALOG_PATH } from "../../../test/testGitCatalogPath";
import GitFileHistory from "../GitFileHistory";

const getGitFileHistoryData = async () => {
	const { wm, rp } = await getApp();
	const dfp = new DiskFileProvider(TEST_GIT_CATALOG_PATH);
	const workspace = wm.current();
	const catalog = await workspace.getCatalog("gitCatalog");
	const fs = workspace.getFileStructure();
	const fp = workspace.getFileProvider();
	const gitFileHistory = new GitFileHistory(catalog, fp);

	return { catalog, dfp, gitFileHistory, fs, fp, rp };
};

describe("GitFileHistory", () => {
	afterAll(async () => {
		const { dfp } = await getGitFileHistoryData();
		await dfp.delete(new Path("new.md"));
	});

	it("Возвращает историю файла и его данные по его itemRef", async () => {
		const { dfp, gitFileHistory } = await getGitFileHistoryData();
		const itemRef = dfp.getItemRef(new Path("gitCatalog/file-with-history.md"));
		const res = await gitFileHistory.getArticleHistoryInfo(itemRef);

		expect(res).toEqual([
			{
				version: "18329a0852d3e29e296a58ff12b55131bd77b5b7",
				author: "Danil Kazanov",
				date: "2023-06-02T13:22:32.000Z",
				content: [
					{ value: "content ", type: undefined },
					{ value: "2", type: "delete" },
					{ value: "3", type: "new" },
					{ value: " \n", type: undefined },
				],
				filePath: {
					path: "file-with-history.md",
					oldPath: "file-with-history.md",
					diff: undefined,
				},
			},
			{
				version: "983c0f7872b3cd3821a3eb97c499f6d44e452059",
				author: "Danil Kazanov",
				date: "2023-06-02T13:22:24.000Z",
				content: [
					{ value: "content ", type: undefined },
					{ value: "1", type: "delete" },
					{ value: "2", type: "new" },
					{ value: " \n", type: undefined },
				],
				filePath: {
					path: "file-with-history.md",
					oldPath: "file-with-history.md",
					diff: undefined,
				},
			},
			{
				version: "f0a85a100163564ffbe8bf8ac8daf5e1696cab82",
				author: "Danil Kazanov",
				date: "2023-06-02T13:22:15.000Z",
				content: [
					{ value: "content 1 \n", type: "new" },
					{ value: "", type: undefined },
				],
				filePath: {
					path: "file-with-history.md",
					oldPath: "file-with-history.md",
					diff: undefined,
				},
			},
		]);
	});

	it("Возвращает пустой массив, если файла не существует в git", async () => {
		const { dfp, gitFileHistory, catalog } = await getGitFileHistoryData();
		await dfp.write(new Path("new.md"), "new file content");
		await catalog.update();
		const itemRef = dfp.getItemRef(new Path("gitCatalog/new.md"));

		const res = await gitFileHistory.getArticleHistoryInfo(itemRef);

		expect(res).toEqual([]);
	});
});
