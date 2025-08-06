import { resolve } from "path";
import { getNavigation } from "../../../features/import/yandex/entities/navigation";
import FetchActions from "../../../features/import/yandex/FetchActions";
import GXCore from "../../../features/import/yandex/GXCore";
import Article from "../../../features/import/yandex/entities/article";
import { InternalPath } from "../../../features/import/yandex/utils";
import ChalkLogger from "../../../utils/ChalkLogger";
import { CONFIG_NAME } from "../../../utils/predefinedValues";
import { loadConfig } from "../utils/config";
import { ImportYandexOptions } from "./command";
import { logStep } from "../utils/logger";
import CliUserError from "../../CliUserError";

export const importYandexCommandFunction = async (options: ImportYandexOptions) => {
	const { raw, config: pathToConfig, destination: pathToDistDir } = options;

	const config = await loadConfig(resolve(pathToConfig, CONFIG_NAME), true);

	const headers = config?.import?.yandex?.headers;
	if (!headers) throw new CliUserError("Headers are not defined in configuration");

	const requiredKeys = ["x-csrf-token", "x-org-id", "cookie"];
	const missing = requiredKeys.filter((key) => !(key in headers));

	if (missing.length > 0) throw new CliUserError(`Missing required headers in config: ${missing.join(", ")}`);

	FetchActions.init(headers);
	InternalPath.init(pathToDistDir);
	Article.setRawMode = Boolean(raw);

	const navigation = await logStep("Fetching navigation", () => getNavigation());
	const articles = await logStep("Fetching articles", () => Article.getArticles(navigation));

	const GxCore = new GXCore();
	GxCore.createContentFolders();

	await logStep("Transforming unsupported elements", () => GxCore.transformUnsupported(articles, raw));
	await logStep("Injecting resources", () => GxCore.injectResources(articles, raw));
	await logStep("Transforming content", () => GxCore.transformContent(articles, raw));

	await logStep("Creating catalog", () => GxCore.createCatalogFromArticlesData(articles, raw));
	await logStep("Downloading resources", () => GxCore.downloadResources(articles));

	ChalkLogger.log();
	ChalkLogger.log(`The catalog has been successfully exported. Saved to:`, { prefix: "SUCCESS" });
	ChalkLogger.log(InternalPath.pathToOutDir, { indent: 1 });
};
