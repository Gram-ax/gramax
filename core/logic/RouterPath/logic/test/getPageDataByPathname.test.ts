import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import getPageDataByPathname, { PageDataType } from "@core/RouterPath/logic/getPageDataByPathname";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const mockLib = {
	getCatalog: (catalogName: string) => {
		const catalogs = {
			exist_in_lib_local: { repo: {} },
			exist_in_lib_remote: {
				repo: {
					storage: {
						getType: () => SourceType.gitHub,
						getSourceName: () => "github.com",
						getGroup: () => "user",
						getName: () => "exist_in_lib_remote",
					},
				},
			},

			local_catalog: { repo: {} },
			default_repName: {
				repo: {
					storage: {
						getType: () => SourceType.gitHub,
						getSourceName: () => "github.com",
						getGroup: () => "user",
						getName: () => "default_repName",
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
				const pathname = "-/-/-/-/local_catalog/file";

				expect(await getDataType(pathname)).toEqual({
					type: PageDataType.article,
					itemLogicPath: ["local_catalog", "file"],
				});
			});
			describe("не локальный", () => {
				test("с веткой", async () => {
					const pathname = "github.com/user/default_repName/master/-/file";

					expect(await getDataType(pathname)).toEqual({
						type: PageDataType.article,
						itemLogicPath: ["default_repName", "file"],
					});
				});
				test("без ветки", async () => {
					const pathname = "github.com/user/default_repName/-/-/file";

					expect(await getDataType(pathname)).toEqual({
						type: PageDataType.article,
						itemLogicPath: ["default_repName", "file"],
					});
				});
				test("с отличным названием каталога, но такого названия нет в библиотеке", async () => {
					const pathname = "github.com/user/default_repName/-/other_catalog_name/file";

					expect(await getDataType(pathname)).toEqual({
						type: PageDataType.article,
						itemLogicPath: ["default_repName", "file"],
					});
				});
			});
		});
		it("главную страницу по валидной ссылке", async () => {
			const pathname = "github.com/user/catalog_not_in_lib/master/-/file";

			expect(await getDataType(pathname)).toEqual({ type: PageDataType.home });
		});
	});
	describe("не находит", () => {
		describe("статью по ссылке на каталог", () => {
			it("локальный", async () => {
				const pathname = "-/-/-/-/local_catalog_not_in_lib";

				expect(await getDataType(pathname)).toEqual({ type: PageDataType.notFound });
			});
			describe("с отличным названием каталога, но в библиотеке есть такой каталог", () => {
				test("локальный", async () => {
					const pathname = "github.com/user/default_repName/-/exist_in_lib_local/file";

					expect(await getDataType(pathname)).toEqual({
						type: PageDataType.notFound,
					});
				});

				test("не локальный", async () => {
					const pathname = "github.com/user/default_repName/-/exist_in_lib_remote/file";

					expect(await getDataType(pathname)).toEqual({
						type: PageDataType.notFound,
					});
				});
			});
		});
		it("статью по невалидным данным в ссылке", async () => {
			const invalidSourceName = "gitaaahub.com/user/default_repName/master/-";
			const invalidGroup = "github.com/useeer/default_repName/master/-";
			const invalidRepName = "github.com/user/default_catalooooog/master/default_repName";
			const noCatalogName = "github.com/user/-/master/default_repName/-";
			expect(await getDataType(invalidRepName)).toEqual({ type: PageDataType.notFound });

			expect(await getDataType(invalidSourceName)).toEqual({ type: PageDataType.notFound });
			expect(await getDataType(invalidGroup)).toEqual({ type: PageDataType.notFound });
			expect(await getDataType(noCatalogName)).toEqual({ type: PageDataType.notFound });
		});
	});
});
