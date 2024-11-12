import getApplication from "@app/node/app";
import { MainWordExport } from "@ext/wordExport/WordExport";
import buildDocumentTree from "@ext/wordExport/DocumentTree/buildDocumentTree";
import { exportedKeys } from "@ext/wordExport/layouts";
import { ExportType } from "@ext/wordExport/ExportType";
import getItemRef from "@ext/workspace/test/getItemRef";
import * as fs from "fs";
import JSZip from "jszip";
import RuleProvider from "@ext/rules/RuleProvider";
import path from "path";
import docx from "docx";
import t from "@ext/localization/locale/translate";
import ctx from "@ext/wordExport/tests/ContextMock";

const generatedFiles: string[] = [];

const getExportData = async (path: string, isCategory: boolean): Promise<Buffer> => {
	const catalog = await (await getApplication()).wm.current().getCatalog("ExportCatalog");
	const isCatalog = path === "";

	const documentTree = await buildDocumentTree(
		isCategory,
		isCatalog,
		isCatalog ? catalog.getRootCategory() : catalog.findItemByItemRef(getItemRef(catalog, path)),
		exportedKeys,
		catalog,
		ctx,
		(
			await getApplication()
		).parser,
		(
			await getApplication()
		).parserContextFactory,
		new RuleProvider(ctx).getItemFilters(),
	);

	return docx.Packer.toBuffer(
		await new MainWordExport(ExportType.withoutTableOfContents, ctx.domain).getDocument(documentTree),
	);
};

const saveBufferToFile = async (buffer: Buffer, fileName: string) => {
	const filePath = path.join(__dirname, fileName);
	await fs.promises.writeFile(filePath, buffer);
	generatedFiles.push(filePath);
	return filePath;
};

const extractDocumentXml = async (filePath: string) => {
	return (
		(await JSZip.loadAsync(await fs.promises.readFile(filePath))).file("word/document.xml")?.async("string") ?? ""
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
