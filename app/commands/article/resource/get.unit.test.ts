import Path from "@core/FileProvider/Path/Path";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import get from "./get";

type GetArgs = Parameters<typeof get.do>[0];

describe("article/resource/get command", () => {
	const runGet = (getCatalog: jest.Mock) => {
		Reflect.set(get, "_app", {
			parser: {},
			parserContextFactory: {},
			healthcheckRegistry: {},
			wm: { current: () => ({ getCatalog }) },
		});

		return get.do({
			ctx: null as unknown as GetArgs["ctx"],
			src: new Path("img.png"),
			mimeType: MimeTypes.png,
			catalogName: "missing-catalog",
			articlePath: new Path("article.md"),
			ifNotExistsErrorText: undefined as unknown as GetArgs["ifNotExistsErrorText"],
			providerType: undefined as unknown as GetArgs["providerType"],
		});
	};

	it("returns undefined instead of throwing when catalog is not found", async () => {
		const getCatalog = jest.fn().mockResolvedValue(undefined);

		await expect(runGet(getCatalog)).resolves.toBeUndefined();
		expect(getCatalog).toHaveBeenCalledWith("missing-catalog", null);
	});
});
