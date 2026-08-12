import Path from "@core/FileProvider/Path/Path";
import Theme from "@ext/Theme/Theme";
import getLogo from "./getLogo";

jest.mock("@core/GitLfs/logic/pullGitLfsObjects", () => {
	const actual = jest.requireActual("@core/GitLfs/logic/pullGitLfsObjects");
	return {
		...actual,
		pullGitLfsObjects: jest.fn(),
	};
});

import { pullGitLfsObjects } from "@core/GitLfs/logic/pullGitLfsObjects";

const POINTER = Buffer.from(
	"version https://git-lfs.github.com/spec/v1\noid sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\nsize 12345\n",
);

describe("catalog/logo/get command", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("pulls LFS objects before returning logo blob", async () => {
		const ctx = { user: { isLogged: true } } as never;
		const exists = jest.fn().mockResolvedValue(true);
		const readAsBinary = jest.fn().mockResolvedValue(POINTER);
		const workspace = {
			getBaseCatalog: jest.fn().mockResolvedValue({
				props: { logo: "logo.png" },
				repo: { path: new Path("/catalog") },
				deref: { isFpReadOnly: false },
				getRootCategoryDirectoryPath: () => new Path("/catalog"),
				getRootCategoryRef: () => ({ storageId: "storage-id" }),
			}),
			getFileProvider: () => ({ exists, readAsBinary }),
		};

		Reflect.set(getLogo, "_app", {
			wm: { current: () => workspace },
			rp: {},
		});

		await getLogo.do({
			ctx,
			catalogName: "Catalog",
			theme: Theme.light,
			force: false,
		});

		expect(readAsBinary).toHaveBeenCalledWith(new Path("/catalog/logo.png"));
		expect(pullGitLfsObjects).toHaveBeenCalledWith({
			catalog: expect.any(Object),
			ctx,
			paths: [new Path("logo.png")],
			rp: {},
		});
	});
});
