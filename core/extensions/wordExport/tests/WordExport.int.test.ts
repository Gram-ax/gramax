import getApplication from "@app/node/app";
import t from "@ext/localization/locale/translate";
import ViewLocalizationFilter from "@ext/properties/logic/viewLocalizationFilter";
import RuleProvider from "@ext/rules/RuleProvider";
import buildDocumentTree from "@ext/wordExport/DocumentTree/buildDocumentTree";
import { ExportType } from "@ext/wordExport/ExportType";
import { getExportedKeys } from "@ext/wordExport/layouts";
import { TitleInfo } from "@ext/wordExport/options/WordTypes";
import ctx from "@ext/wordExport/tests/ContextMock";
import { MainWordExport } from "@ext/wordExport/WordExport";
import getItemRef from "@ext/workspace/test/getItemRef";
import * as docx from "docx";
import * as fs from "fs";
import JSZip from "jszip";
import path from "path";

const generatedFiles: string[] = [];

const getExportData = async (path: string, isCategory: boolean): Promise<Buffer> => {
	const catalog = await (await getApplication()).wm.current().getCatalog("ExportCatalog", ctx);

	const isCatalog = path === "";
	const titlesMap: Map<string, TitleInfo> = new Map();

	const documentTree = await buildDocumentTree(
		isCategory,
		isCatalog,
		isCatalog ? catalog.getRootCategory() : catalog.findItemByItemRef(getItemRef(catalog, path)),
		getExportedKeys(),
		catalog,
		ctx,
		(
			await getApplication()
		).parser,
		(
			await getApplication()
		).parserContextFactory,
		new RuleProvider(ctx, null).getItemFilters(),
		titlesMap,
	);

	const itemFilters = [
		...new RuleProvider(ctx, undefined, undefined).getItemFilters(),
		new ViewLocalizationFilter().getItemFilter(),
	];

	return docx.Packer.toBuffer(
		await new MainWordExport(ExportType.withoutTableOfContents, titlesMap, catalog, itemFilters).getDocument(
			documentTree,
		),
	);
};

const saveBufferToFile = async (buffer: Buffer, fileName: string) => {
	const filePath = path.join(__dirname, fileName);
	await fs.promises.writeFile(filePath, new Uint8Array(buffer));
	generatedFiles.push(filePath);
	return filePath;
};

const extractDocumentXml = async (filePath: string) => {
	return (
		(await JSZip.loadAsync(new Uint8Array(await fs.promises.readFile(filePath))))
			.file("word/document.xml")
			?.async("string") ?? ""
	);
};

const replaysIdsToZero = (xmlString: string) => {
	return xmlString.replace(/r:id="[^"]+"/g, 'r:id="0"');
};

afterEach(async () => {
	for (const filePath of generatedFiles) {
		try {
			await fs.promises.unlink(filePath);
		} catch (err) {
			console.error(`${t("word.error.delete-failed-error")} ${filePath}:`, err);
		}
	}
	generatedFiles.length = 0;
});

describe("Экспорт правильно", () => {
	test("экспортирует статью", async () => {
		const exportData = await getExportData("category/article/_index.md", false);
		const filePath = await saveBufferToFile(exportData, "article.docx");
		const documentXml = replaysIdsToZero(await extractDocumentXml(filePath));
		const referenceXml = replaysIdsToZero(
			await fs.promises.readFile(path.join(__dirname, "referenceArticle.xml"), "utf-8"),
		);
		expect(documentXml).toEqual(referenceXml);
	});

	test("экспортирует раздел", async () => {
		const exportData = await getExportData("category/_index.md", true);
		const filePath = await saveBufferToFile(exportData, "category.docx");
		const documentXml = replaysIdsToZero(await extractDocumentXml(filePath));
		const referenceXml = replaysIdsToZero(
			await fs.promises.readFile(path.join(__dirname, "referenceCategory.xml"), "utf-8"),
		);
		expect(documentXml).toEqual(referenceXml);
	});

	test("экспортирует каталог", async () => {
		const exportData = await getExportData("", false);
		const filePath = await saveBufferToFile(exportData, "catalog.docx");
		const documentXml = replaysIdsToZero(await extractDocumentXml(filePath));
		const referenceXml = replaysIdsToZero(
			await fs.promises.readFile(path.join(__dirname, "referenceCatalog.xml"), "utf-8"),
		);
		expect(documentXml).toEqual(referenceXml);
	});
});
