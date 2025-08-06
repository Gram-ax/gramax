import { resolve, join, basename, dirname } from "path";
import { fileURLToPath } from "url";
import { loadConfig } from "../utils/config";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import { BuildOptions } from "./command";
import { check } from "../check";
import Path from "@core/FileProvider/Path/Path";
import getApp from "@app/node/app";
import StaticSiteBuilder from "../../StaticSiteBuilder";
import ChalkLogger from "../../../utils/ChalkLogger";
import { checkExistsPath, setRootPath } from "../utils/paths";
import CliUserError from "../../CliUserError";
const CONFIG_NAME = "gramax.config.yaml";

enum EnvVariables {
	LOGO_IMAGE_URL = "LOGO_IMAGE_URL",
	LOGO_LINK_URL = "LOGO_LINK_URL",
	YANDEX_METRIC_COUNTER = "YANDEX_METRIC_COUNTER",
	MATOMO_SITE_ID = "MATOMO_SITE_ID",
	MATOMO_URL = "MATOMO_URL",
	MATOMO_CONTAINER_URL = "MATOMO_CONTAINER_URL",
}

const envVariableNames: Record<EnvVariables, string> = {
	[EnvVariables.LOGO_IMAGE_URL]: "Logo image URL",
	[EnvVariables.LOGO_LINK_URL]: "Logo link URL",
	[EnvVariables.YANDEX_METRIC_COUNTER]: "Yandex metric counter",
	[EnvVariables.MATOMO_SITE_ID]: "Matomo site ID",
	[EnvVariables.MATOMO_URL]: "Matomo URL",
	[EnvVariables.MATOMO_CONTAINER_URL]: "Matomo container URL",
};

const setEnv = async (fullPath: string) => {
	const buildConfig = (await loadConfig(join(fullPath, CONFIG_NAME))).build;

	const envMapping: Record<EnvVariables, string | undefined> = {
		[EnvVariables.LOGO_IMAGE_URL]: buildConfig?.logo?.imageUrl,
		[EnvVariables.LOGO_LINK_URL]: buildConfig?.logo?.linkUrl,
		[EnvVariables.YANDEX_METRIC_COUNTER]: buildConfig?.metrics?.yandex?.metricCounter,
		[EnvVariables.MATOMO_SITE_ID]: buildConfig?.metrics?.matomo?.siteId,
		[EnvVariables.MATOMO_URL]: buildConfig?.metrics?.matomo?.matomoUrl,
		[EnvVariables.MATOMO_CONTAINER_URL]: buildConfig?.metrics?.matomo?.matomoContainerUrl,
	};

	Object.entries(envMapping).forEach(([key, value]) => {
		if (!process.env[key] && value) {
			process.env[key] = value;
		}
	});

	Object.entries(envMapping).forEach(([key]) => {
		if (process.env[key]) {
			const readableKey = envVariableNames[key];
			ChalkLogger.log(`  ${readableKey}: "${process.env[key]}"`);
		}
	});

	if (Object.keys(envMapping).some((value) => process.env[value])) {
		ChalkLogger.log();
	}
};

const buildCommandFunction = async (options: BuildOptions) => {
	const { source, destination, SkipCheck } = options;

	const targetDir = new Path(destination);
	const fullPath = resolve(source);
	setRootPath(fullPath);

	await checkExistsPath(fullPath);
	const fp = new DiskFileProvider("");
	if (!(await fp.isFolder(new Path(fullPath)))) throw new CliUserError("The provided path is not a directory.");

	const catalogName = basename(fullPath);
	await setEnv(fullPath);

	const app = await getApp();
	const wm = app.wm.current();
	const catalog = await wm.getContextlessCatalog(catalogName);
	if (!catalog) throw new CliUserError("This is an empty catalog");

	if (!SkipCheck) {
		if (!(await check(catalogName))) process.exit(1);
		ChalkLogger.log();
	}
	const assetsDir = new Path(dirname(fileURLToPath(import.meta.url)));

	await fp.copy(assetsDir.join(new Path(StaticSiteBuilder.readonlyDir)), targetDir);

	const templateHtml = await fp.read(targetDir.join(new Path("index.html")));
	await new StaticSiteBuilder(fp, app, templateHtml).generate(catalog, targetDir);
};
export default buildCommandFunction;
