import { SourceDataProvider } from "./SourceDataProvider";
import { Encoder } from "../../../../Encoder/Encoder";
import WorkspaceManager from "../../../../workspace/WorkspaceManager";
import Cookie from "../../../../cookie/Cookie";

describe("SourceDataProvider", () => {
	let workspaceManager: WorkspaceManager;
	let cookie: Cookie;
	let provider: SourceDataProvider;
	let encoder: Encoder;
	let encodeTestData: (data: any) => string;
	const testStorageName = "test-storage";
	const testPath = "/path/with/slashes";
	const encodedPath = encodeURIComponent(testPath);
	const postfix = "_storage_data";
	const secret = "UGnL8QMQqw";

	beforeEach(() => {
		encoder = new Encoder();
		encodeTestData = (data: any): string => {
			return encoder.ecode([JSON.stringify(data)], secret);
		};

		workspaceManager = {
			hasWorkspace: jest.fn().mockReturnValue(true),
			maybeCurrent: jest.fn().mockReturnValue({ path: () => testPath }),
		} as unknown as WorkspaceManager;

		cookie = {
			getAllNames: jest.fn().mockReturnValue([]),
			exist: jest.fn().mockReturnValue(false),
			get: jest.fn(),
			remove: jest.fn(),
		} as unknown as Cookie;

		provider = new SourceDataProvider(workspaceManager, cookie);
	});

	describe("compatibility with old cookie paths", () => {
		const testSourceData = {
			sourceType: "git",
			url: "https://github.com/test/repo",
		};
		let encodedSourceData: string;

		beforeEach(() => {
			encodedSourceData = encodeTestData(testSourceData);
		});

		describe("getSourceByName", () => {
			it("should read data with unencoded path if old cookie exists", () => {
				const cookieName = `${testStorageName}${postfix}${testPath}`;
				(cookie.getAllNames as jest.Mock).mockReturnValue([cookieName]);
				(cookie.get as jest.Mock).mockReturnValue(encodedSourceData);

				const result = provider.getSourceByName(testStorageName);

				expect(cookie.get).toHaveBeenCalledWith(cookieName);
				expect(result.raw).toMatchObject(testSourceData);
			});

			it("should read data with encoded path if old cookie does not exist", () => {
				const cookieName = `${testStorageName}${postfix}${encodedPath}`;
				(cookie.getAllNames as jest.Mock).mockReturnValue([]);
				(cookie.get as jest.Mock).mockReturnValue(encodedSourceData);

				const result = provider.getSourceByName(testStorageName);

				expect(cookie.get).toHaveBeenCalledWith(cookieName);
				expect(result.raw).toMatchObject(testSourceData);
			});

			it("should select the correct format when both types of cookies are present", () => {
				const oldCookieName = `${testStorageName}${postfix}${testPath}`;
				const newCookieName = `${testStorageName}${postfix}${encodedPath}`;

				(cookie.getAllNames as jest.Mock).mockReturnValue([oldCookieName, "other-cookie", newCookieName]);
				(cookie.get as jest.Mock).mockReturnValue(encodedSourceData);

				const result = provider.getSourceByName(testStorageName);

				expect(cookie.get).toHaveBeenCalledWith(oldCookieName);
				expect(result.raw).toMatchObject(testSourceData);
			});

			it("should throw an error if the cookie does not exist", () => {
				(cookie.getAllNames as jest.Mock).mockReturnValue([]);
				(cookie.get as jest.Mock).mockReturnValue(null);

				expect(() => provider.getSourceByName(testStorageName)).toThrow(new RegExp(testStorageName));
			});
		});

		describe("getSourceDatas", () => {
			it("returns unencoded cookies if old cookies exist", () => {
				const oldFormatData = { ...testSourceData, name: "old" };
				const newFormatData = { ...testSourceData, name: "new" };

				const cookieData = {
					[`storage1${postfix}${testPath}`]: encodeTestData(oldFormatData),
					[`storage2${postfix}${encodedPath}`]: encodeTestData(newFormatData),
				};

				(cookie.getAllNames as jest.Mock).mockReturnValue(Object.keys(cookieData));
				(cookie.get as jest.Mock).mockImplementation((name) => cookieData[name]);

				jest.spyOn(Object, "values").mockReturnValue(["git"]);

				const results = provider.getSourceDatas();

				expect(results).toHaveLength(1);
				expect(results[0]).toMatchObject(oldFormatData);
			});
		});

		describe("isSourceExists", () => {
			it("should find source with unencoded path if old cookie exists", () => {
				const cookieName = `${testStorageName}${postfix}${testPath}`;
				(cookie.getAllNames as jest.Mock).mockReturnValue([cookieName]);
				(cookie.exist as jest.Mock).mockReturnValue(true);

				const result = provider.isSourceExists(testStorageName);

				expect(result).toBe(true);
				expect(cookie.exist).toHaveBeenCalledWith(cookieName);
			});

			it("should find source with encoded path if old cookie does not exist", () => {
				const cookieName = `${testStorageName}${postfix}${encodedPath}`;
				(cookie.getAllNames as jest.Mock).mockReturnValue([]);
				(cookie.exist as jest.Mock).mockReturnValue(true);

				const result = provider.isSourceExists(testStorageName);

				expect(result).toBe(true);
				expect(cookie.exist).toHaveBeenCalledWith(cookieName);
			});
		});
	});
});
