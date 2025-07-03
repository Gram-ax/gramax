import Path from "@core/FileProvider/Path/Path";
import FileRepository from "@ext/git/core/Repository/test/utils/FileRepository";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import fs from "fs";

const fr = new FileRepository(__dirname);

describe("FileRepository", () => {
	it("should create a file repositories", async () => {
		const { firstInstance, secondInstance } = fr.create();

		expect(fs.existsSync(fr.firstPath)).toBeTruthy();
		expect(fs.existsSync(fr.secondPath)).toBeTruthy();
		expect(fs.existsSync(fr.barePath)).toBeTruthy();

		expect(fs.readFileSync(fr.firstPath + "/init", "utf-8")).toBe("init");
		expect(fs.readFileSync(fr.secondPath + "/init", "utf-8")).toBe("init");

		const firstCurrentBranchData = (await firstInstance.gvc.getCurrentBranch()).getData();
		const secondCurrentBranchData = (await secondInstance.gvc.getCurrentBranch()).getData();

		expect(firstCurrentBranchData.lastCommitAuthor).toBe(FileRepository.sourceData.userName);
		expect(firstCurrentBranchData.name).toBe("master");

		expect(secondCurrentBranchData.lastCommitAuthor).toBe(FileRepository.sourceData.userName);
		expect(secondCurrentBranchData.name).toBe("master");
	});

	it("should clear the file repositories", () => {
		fr.clear();

		expect(fs.existsSync(fr.barePath)).toBeFalsy();
		expect(fs.existsSync(fr.firstPath)).toBeFalsy();
		expect(fs.existsSync(fr.secondPath)).toBeFalsy();
	});

	describe("works with git commands", () => {
		let firstInstance: WorkdirRepository;
		let secondInstance: WorkdirRepository;

		beforeEach(() => {
			({ firstInstance, secondInstance } = fr.create());
		});

		afterEach(() => {
			fr.clear();
		});

		test("pull and push", async () => {
			fs.writeFileSync(fr.firstPath + "/test.txt", "test");

			await firstInstance.publish({
				data: FileRepository.sourceData,
				commitMessage: "test",
				filesToPublish: [new Path("test.txt")],
			});

			await secondInstance.sync({ data: FileRepository.sourceData, recursivePull: false });

			expect(fs.readFileSync(fr.secondPath + "/test.txt", "utf-8")).toBe("test");
		});
	});
});
