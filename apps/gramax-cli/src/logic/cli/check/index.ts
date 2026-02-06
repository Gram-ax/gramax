import { getConfig } from "@app/config/AppConfig";
import getApp from "@app/node/app";
import getCommands from "@app/node/commands";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { CatalogErrorGroups } from "@core/FileStructue/Catalog/CatalogErrorGroups";
import { CatalogErrors } from "@ext/healthcheck/logic/Healthcheck";
import chalk from "chalk";
import { basename, resolve } from "path";
import ChalkLogger from "../../../utils/ChalkLogger";
import { CustomSuccessLog, logStepWithErrorSuppression } from "../utils/logger";
import { checkExistsPath, getPathWithExtension, setRootPath } from "../utils/paths";
import { ChalkFileLogger } from "./ChalkFileLogger";
import { CheckOptions, defaultCheckName } from "./command";

type errorsType = Record<keyof typeof CatalogErrorGroups, string[]>;

enum ErrorMessages {
	images = "Incorrect image path",
	links = "Incorrect link path",
	icons = "Incorrect icon name",
	diagrams = "Incorrect diagram path",
	unsupported = "Unsupported element",
	content = "Incorrect syntax",
}

interface ResourceError {
	title: string;
	logicPath: string;
	editorLink: string;
	errors: errorsType;
}

type TransformedCatalogErrors = { totalErrors: number; resourcesErrors: ResourceError[] };

const transformCatalogErrorsToResourceErrors = (catalogErrors: CatalogErrors): TransformedCatalogErrors => {
	const groupedByLogicPath = new Map<string, ResourceError>();
	let totalErrors = 0;

	for (const [groupKey, errors] of Object.entries(catalogErrors)) {
		for (const error of errors) {
			const { logicPath, title, editorLink, value } = error.args;

			if (!groupedByLogicPath.has(logicPath)) {
				groupedByLogicPath.set(logicPath, {
					title,
					logicPath,
					editorLink,
					errors: Object.fromEntries(Object.keys(catalogErrors).map((key) => [key, []])) as errorsType,
				});
			}

			const resourceError = groupedByLogicPath.get(logicPath);
			resourceError.errors[groupKey].push(value);
			totalErrors++;
		}
	}

	return { totalErrors, resourcesErrors: Array.from(groupedByLogicPath.values()) };
};

const getErrorContent = async (
	transformedCatalogErrors: TransformedCatalogErrors,
	catalog: Catalog,
	output: string,
) => {
	const { totalErrors, resourcesErrors } = transformedCatalogErrors;
	if (!resourcesErrors.length) return;
	const getArticlePath = (logicPath: string) => catalog.findArticle(logicPath, []).ref.path;

	const logger = output
		? new ChalkFileLogger(await getPathWithExtension(resolve(output), defaultCheckName))
		: ChalkLogger;
	const fp = new DiskFileProvider(getConfig().paths.data);

	resourcesErrors.map((resourceErrors) => {
		logger.log(`${fp.toAbsolute(getArticlePath(resourceErrors.logicPath))}`);
		Object.values(CatalogErrorGroups).map((errorGroup) => {
			const errors = resourceErrors.errors[errorGroup.type];
			if (errors.length) {
				errors.map((e) => logger.log(`${chalk.red(ErrorMessages[errorGroup.type])}: ${e}`, { indent: 1 }));
			}
		});
		logger.log();
	});
	const errorMessage = `${totalErrors} problems found in ${resourcesErrors.length} files`;
	logger.log(errorMessage, { prefix: "ERROR" });
	if (logger instanceof ChalkFileLogger) await logger.close();
};

const checkCatalog = async (catalogName: string) => {
	const app = await getApp();
	const ctx = await app.contextFactory.fromBrowser({
		language: "",
	});
	const commands = getCommands(app);
	const catalogErrors = await commands.healthcheck.do({ ctx, catalogName });
	const result = transformCatalogErrorsToResourceErrors(catalogErrors);
	return result;
};

export const checkCommandFunction = async (options: CheckOptions) => {
	const fullPath = resolve(options.destination);
	await checkExistsPath(fullPath);

	const catalogName = basename(fullPath);
	setRootPath(fullPath);
	if (!(await check(catalogName, options.output))) process.exit(1);
};

export const check = async (catalogName: string, output?: string) => {
	const app = await getApp();
	const wm = app.wm.current();
	const catalog = await wm.getContextlessCatalog(catalogName);
	const message = "Checking the catalog for errors";

	const customSuccessLog: CustomSuccessLog<TransformedCatalogErrors> = (result) => ({
		message,
		LogSymbol: result.totalErrors ? "ERROR" : "SUCCESS_EXT",
	});

	const transformedCatalogErrors = await logStepWithErrorSuppression(
		message,
		() => checkCatalog(catalogName),
		customSuccessLog,
	);
	if (!transformedCatalogErrors.totalErrors) return true;
	ChalkLogger.log();
	await getErrorContent(transformedCatalogErrors, catalog, output);
	ChalkLogger.log();
	return false;
};
