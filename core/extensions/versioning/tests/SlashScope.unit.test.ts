import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";

const root = new Path([__dirname, "__test_slash"]);
const repoPath = new Path("repo");
const dfp = new DiskFileProvider(root);
const git = new GitCommands(dfp, repoPath);

const creds: GitSourceData = {
	userName: "test",
	userEmail: "test@test.com",
	sourceType: SourceType.gitLab,
	domain: "test",
	token: "test",
};

const getTestImageBuffer = async () => {
	const imgFp = new DiskFileProvider(new Path(__dirname));
	return imgFp.readAsBinary(new Path("testImage.png"));
};

const prepareRepo = async () => {
	await dfp.mkdir(repoPath);
	await git.init(creds);

	const imgFp = new DiskFileProvider(new Path(__dirname));
	await imgFp.copy(new Path("testImage.png"), new Path(["__test_slash", "repo", "testImage.png"]));

	await dfp.write(repoPath.join(new Path("file")), "content");
	await git.add();
	await git.commit("init", creds);

	await git.createNewBranch("releases/v1.0");
	await dfp.write(repoPath.join(new Path("file")), "v1 content");
	await git.add();
	await git.commit("v1", creds);
	await git.checkout(creds, "master");
};

describe("версия со слэшем в имени", () => {
	beforeAll(prepareRepo);
	afterAll(async () => await dfp.delete(Path.empty));

	test("читает файл по закодированному скоупу", async () => {
		const gitfp = new GitTreeFileProvider(git);
		gitfp.withMountPath(root.join(repoPath));
		expect(await gitfp.read(new Path("repo:releases%2Fv1.0/file"))).toBe("v1 content");
	});

	test("читает картинку по закодированному скоупу", async () => {
		const gitfp = new GitTreeFileProvider(git);
		gitfp.withMountPath(root.join(repoPath));
		const image = await gitfp.readAsBinary(new Path("repo:releases%2Fv1.0/testImage.png"));
		expect(image).toEqual(await getTestImageBuffer());
	});
});
