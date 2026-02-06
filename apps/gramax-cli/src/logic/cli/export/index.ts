import { getConfig } from "@app/config/AppConfig";
import getApp from "@app/node/app";
import getCommands from "@app/node/commands";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import { ExportFormat } from "@ext/wordExport/components/ItemExport";
import chalk from "chalk";
import { exists, mkdir, readFile, writeFileSync } from "fs-extra";
import { basename, dirname, resolve } from "path";
import ChalkLogger from "../../../utils/ChalkLogger";
import CliUserError from "../../CliUserError";
import askQuestion from "../utils/askQuestion";
import { logStep, logStepWithErrorSuppression } from "../utils/logger";
import { checkExistsPath, getPathWithExtension, setRootPath } from "../utils/paths";
import { defaultName, type ExportOptions } from "./command";
import legacyExport from "./legacyExport";
import runPdfCli from "./newPdf/runPdfCli";

const fileExts: { [key in ExportFormat]: string } = {
	pdf: "pdf",
	"legacy-pdf": "pdf",
	"beta-pdf": "pdf",
	docx: "docx",
};

const warnMessages: Partial<{ [key in ExportFormat]: string }> = {
	"legacy-pdf": `\`legacy-pdf\` uses the legacy PDF export for compatibility. Use \`pdf\` unless you need the old output.`,
	"beta-pdf": `\`beta-pdf\` is now an alias of \`pdf\`. Use \`pdf\` instead.`,
};

export const exportCommandFunction = async (options: ExportOptions) => {
	const { source, output, yes: skipConfirm, format, template, PdfNumber, PdfTitle, PdfToc } = options;

	if (!ExportFormat[format]) throw new CliUserError(`Unsupported format: ${format}. Allowed formats: docx, pdf`);

	const warnMessage = warnMessages[format];
	if (warnMessage) ChalkLogger.warn(`${warnMessage}\n`);

	const fileExt = fileExts[format];
	const formatName = fileExt.toUpperCase();
	const outputPath = await getPathWithExtension(resolve(output), `${defaultName}.${fileExt}`);

	const fullPath = resolve(source);
	await checkExistsPath(fullPath);

	const catalogName = basename(fullPath);
	setRootPath(fullPath);

	const app = await getApp();
	const ctx = await app.contextFactory.fromBrowser({
		language: "",
	});
	const commands = getCommands(app);
	const workspace = app.wm.current();
	const catalog = await workspace.getContextlessCatalog(catalogName);
	const fp = new DiskFileProvider(getConfig().paths.root);

	const getTemplateValue = async () => {
		if (!template) return;
		if (format === ExportFormat["legacy-pdf"]) {
			ChalkLogger.warn("`template` is not applicable when format is 'legacy-pdf'. It will be ignored.");
			ChalkLogger.log();
			return;
		}

		const templatePath = resolve(template);
		const hasSlash = template.includes("/") || template.includes("\\");

		const getTemplate = async () => {
			const existsAsPath = await exists(templatePath);
			if (existsAsPath) return await readFile(templatePath);

			if (hasSlash) return;

			const workspaceTemplates = (await app.wtm.from(workspace))?.getTemplates() ?? [];
			const workspaceTemplate = workspaceTemplates.find((t) => t === template || t.split(".")[0] === template);
			return workspaceTemplate;
		};

		const wordTemplate = await getTemplate();
		if (wordTemplate) return wordTemplate;

		const errorMessage = hasSlash
			? `Template file '${templatePath}' not found.`
			: `Template '${template}' not found: no such file '${template}' in current directory, and no template named '${template}' found in current workspace.`;

		throw new CliUserError(errorMessage);
	};

	const checkAndProcessUnsupportedElements = async () => {
		const checkMessage = "Checking for unsupported elements";
		const customSuccessLog = (result: UnsupportedElements[]) => {
			if (result.length) {
				const totalElements = result.reduce((acc, errorElement) => acc + errorElement.elements.length, 0);
				return {
					message: `${checkMessage}...   ${chalk.yellow(
						`${totalElements} unsupported elements found in ${result.length} files:`,
					)}`,
				};
			}
		};
		const errorElements: UnsupportedElements[] = await logStepWithErrorSuppression(
			checkMessage,
			() =>
				commands.word.getErrorElements.do({
					ctx,
					catalogName,
					itemPath: new Path(""),
					isCategory: true,
					exportFormat: ExportFormat[format],
				}),
			customSuccessLog,
		);
		if (errorElements.length) {
			ChalkLogger.log();
			errorElements.forEach((element) => {
				ChalkLogger.warn(`${fp.toAbsolute(catalog.findArticle(element.article.link, []).ref.path)}`, {
					indent: 1,
				});
				element.elements.forEach((unsupported) => {
					ChalkLogger.warn(`- ${unsupported.name}${unsupported.count > 1 ? ` (${unsupported.count})` : ""}`, {
						indent: 2,
					});
				});
				ChalkLogger.log();
			});
			ChalkLogger.warn(
				`${formatName} does not support some elements of Gramax. The file will be saved without them.`,
			);
			ChalkLogger.log();
			if (skipConfirm) return;
			const answer = await askQuestion(chalk.white("Do you want to continue? (Y/n): "));
			if (answer && answer.toLowerCase() !== "y") {
				ChalkLogger.log();
				process.exit(0);
			}
		}
	};

	const simpleExport = async () => {
		const wordTemplate = await getTemplateValue();
		await checkAndProcessUnsupportedElements();
		const getWordCommand: typeof commands.word.getAsWordDocument.do = commands.word.getAsWordDocument.do.bind(
			commands.word.getAsWordDocument,
		);
		const command: typeof getWordCommand = format === ExportFormat.docx ? getWordCommand : legacyExport(app);

		const wordDocument = await logStepWithErrorSuppression(`Generating ${formatName}`, () =>
			command({
				ctx,
				catalogName,
				itemPath: new Path(""),
				isCategory: true,
				wordTemplate,
			}),
		);

		await logStep(`Saving ${formatName}`, async () => {
			await mkdir(dirname(outputPath), { recursive: true });
			writeFileSync(outputPath, new Uint8Array(wordDocument));
		});
	};

	await (format === ExportFormat.pdf || format === ExportFormat["beta-pdf"]
		? runPdfCli({
				source,
				output: outputPath,
				skipConfirm,
				params: {
					tocPage: PdfToc,
					titlePage: PdfTitle,
					titleNumber: PdfNumber,
					template,
				},
			})
		: simpleExport());
	ChalkLogger.log(`Saved to: ${outputPath}`, { indent: 1 });
};
