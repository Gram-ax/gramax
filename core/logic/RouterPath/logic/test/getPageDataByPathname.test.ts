import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import getPageDataByPathname, { PageDataType } from "@core/RouterPath/logic/getPageDataByPathname";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const mockLib = {
	getCatalog: (catalogName: string) => {
		const catalogs = {
			local_catalog: {},
			default_catalog: {
				repo: {
					storage: {
						getType: () => SourceType.gitHub,
						getSourceName: () => "github.com",
						getGroup: () => "user",
						getName: () => "default_catalog",
					},
				},
			},
		};

		return catalogs[catalogName];
	},
};

const getDataType = async (pathname: string) =>
	await getPageDataByPathname(RouterPathProvider.parsePath(new Path(pathname)), mockLib as any);

describe("getPageDataByPathname", () => {
	describe("находит", () => {
		describe("статью по ссылке на каталог", () => {
			it("локальный", async () => {
				const pathname = "-/-/-/-/local_catalog";

				expect(await getDataType(pathname)).toBe(PageDataType.article);
			});
			describe("не локальный", () => {
				test("с веткой", async () => {
					const pathname = "github.com/user/default_catalog/master/-";

					expect(await getDataType(pathname)).toBe(PageDataType.article);
				});
				test("без ветки", async () => {
					const pathname = "github.com/user/default_catalog/-/-";

					expect(await getDataType(pathname)).toBe(PageDataType.article);
				});
			});
		});
		it("главную страницу по валидной ссылке", async () => {
			const pathname = "github.com/user/catalog_not_in_lib/master/-";

			expect(await getDataType(pathname)).toBe(PageDataType.home);
		});
	});
	describe("не находит", () => {
		describe("статью по ссылке на каталог", () => {
			it("локальный", async () => {
				const pathname = "-/-/-/-/local_catalog_not_in_lib";

				expect(await getDataType(pathname)).toBe(PageDataType.notFound);
			});
		});
		it("статью по невалидным данным в ссылке", async () => {
			const invalidSourceName = "gitaaahub.com/user/default_catalog/master/-";
			const invalidGroup = "github.com/useeer/default_catalog/master/-";
			const invalidRepName = "github.com/user/default_catalooooog/master/default_catalog";
			const noCatalogName = "github.com/user/-/master/default_catalog";

			expect(await getDataType(invalidSourceName)).toBe(PageDataType.notFound);
			expect(await getDataType(invalidGroup)).toBe(PageDataType.notFound);
			expect(await getDataType(invalidRepName)).toBe(PageDataType.notFound);
			expect(await getDataType(noCatalogName)).toBe(PageDataType.notFound);
		});
	});
});
