import getApp from "@app/node/app";
import getCommands from "@app/node/commands";
import Path from "@core/FileProvider/Path/Path";
import UnsupportedElements from "@ext/import/model/UnsupportedElements";
import { defaultName, ExportOptions } from "./command";
import { logStepWithErrorSuppression, logStep } from "../utils/logger";
import { getPathWithExtension, setRootPath } from "../utils/paths";
import { basename, resolve, dirname } from "path";
import readline from "readline";
import { getConfig } from "@app/config/AppConfig";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import chalk from "chalk";
import { mkdir, writeFileSync } from "fs-extra";
import { ExportFormat } from "@ext/wordExport/components/ItemExport";
import ChalkLogger from "../../../utils/ChalkLogger";

const askQuestion = (query: string): Promise<string> => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(query, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
};

export const exportCommandFunction = async (options: ExportOptions) => {
	const { source, output, yes: skipConfirm, format } = options;

	if (!ExportFormat[format]) throw new Error(`Unsupported format: ${format}. Allowed formats: docx, pdf`);
	const formatName = format.toUpperCase();
	const outputPath = await getPathWithExtension(resolve(output), `${defaultName}.${format}`);

	const fullPath = resolve(source);
	const catalogName = basename(fullPath);
	setRootPath(fullPath);

	const app = await getApp();
	const ctx = await app.contextFactory.fromBrowser("", null);
	const commands = getCommands(app);
	const wm = app.wm.current();
	const catalog = await wm.getContextlessCatalog(catalogName);
	const fp = new DiskFileProvider(getConfig().paths.root);

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
					exportFormat: format,
				}),
			customSuccessLog,
		);
		if (errorElements.length) {
			ChalkLogger.log();
			const logWarnMessage = (str: string, indent?: number) =>
				ChalkLogger.log(str, { styles: ["yellow"], indent });
			errorElements.forEach((element) => {
				logWarnMessage(`${fp.toAbsolute(catalog.findArticle(element.article.link, []).ref.path)}`, 1);
				element.elements.forEach((unsupported) => {
					logWarnMessage(`- ${unsupported.name}${unsupported.count > 1 ? ` (${unsupported.count})` : ""}`, 2);
				});
				ChalkLogger.log();
			});
			logWarnMessage(
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

	await checkAndProcessUnsupportedElements();

	const command = format === ExportFormat.docx ? commands.word.getAsWordDocument : commands.pdf.getDocument;
	const wordDocument = await logStepWithErrorSuppression(`Generating ${formatName}`, () =>
		command.do({
			ctx,
			catalogName,
			itemPath: new Path(""),
			isCategory: true,
		}),
	);

	await logStep(`Saving ${formatName}`, async () => {
		await mkdir(dirname(outputPath), { recursive: true });
		writeFileSync(outputPath, new Uint8Array(wordDocument));
	});
	ChalkLogger.log();
	ChalkLogger.log(`Export completed successfully. Saved to:`, { prefix: "SUCCESS" });
	ChalkLogger.log(outputPath, { indent: 1 });
};
