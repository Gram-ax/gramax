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
import { checkExistsPath, checkIsFile, setRootPath } from "../utils/paths";
import CliUserError from "../../CliUserError";
import { copyWordTemplatesInCli, copyPdfTemplatesInCli } from "./copyTemplatesInCli";
import { setFeatureList } from "@ext/toggleFeatures/features";

const CONFIG_NAME = "gramax.config.yaml";

enum EnvVariables {
	LOGO_IMAGE_URL = "LOGO_IMAGE_URL",
	LOGO_LINK_URL = "LOGO_LINK_URL",
	YANDEX_METRIC_COUNTER = "YANDEX_METRIC_COUNTER",
	MATOMO_SITE_ID = "MATOMO_SITE_ID",
	MATOMO_URL = "MATOMO_URL",
	MATOMO_CONTAINER_URL = "MATOMO_CONTAINER_URL",
	FORCE_UI_LANG_SYNC = "FORCE_UI_LANG_SYNC",
	FEATURES = "FEATURES",
}

const envVariableNames: Record<EnvVariables, string> = {
	[EnvVariables.LOGO_IMAGE_URL]: "Logo image URL",
	[EnvVariables.LOGO_LINK_URL]: "Logo link URL",
	[EnvVariables.YANDEX_METRIC_COUNTER]: "Yandex metric counter",
	[EnvVariables.MATOMO_SITE_ID]: "Matomo site ID",
	[EnvVariables.MATOMO_URL]: "Matomo URL",
	[EnvVariables.MATOMO_CONTAINER_URL]: "Matomo container URL",
	[EnvVariables.FORCE_UI_LANG_SYNC]: "Force ui lang sync",
	[EnvVariables.FEATURES]: "Features",
};

type EnvValue = string | boolean | undefined;
type EnvEntry = [EnvVariables, EnvValue];

const setEnvVar = (key: EnvVariables, val: string | boolean) => {
	process.env[key] = typeof val === "boolean" ? String(val) : val;
};

const loadCustomStyles = async (cssPath: string | undefined, fp: DiskFileProvider): Promise<string | undefined> => {
	if (!cssPath) return;
	const resolvedPath = resolve(cssPath);
	await checkIsFile(resolvedPath);
	return await fp.read(new Path(resolvedPath));
};

const setEnv = async (fullPath: string, options: { forceUiLangSync: boolean; features: string }) => {
	const buildConfig = (await loadConfig(join(fullPath, CONFIG_NAME))).build;

	const envMapping: Record<EnvVariables, EnvValue> = {
		[EnvVariables.LOGO_IMAGE_URL]: buildConfig?.logo?.imageUrl,
		[EnvVariables.LOGO_LINK_URL]: buildConfig?.logo?.linkUrl,
		[EnvVariables.YANDEX_METRIC_COUNTER]: buildConfig?.metrics?.yandex?.metricCounter,
		[EnvVariables.MATOMO_SITE_ID]: buildConfig?.metrics?.matomo?.siteId,
		[EnvVariables.MATOMO_URL]: buildConfig?.metrics?.matomo?.matomoUrl,
		[EnvVariables.MATOMO_CONTAINER_URL]: buildConfig?.metrics?.matomo?.matomoContainerUrl,
		[EnvVariables.FORCE_UI_LANG_SYNC]: buildConfig?.forceUiLangSync,
		[EnvVariables.FEATURES]:
			typeof buildConfig?.features === "string" ? buildConfig?.features : buildConfig?.features?.join(","),
	};

	const optionsMapping: Partial<Record<EnvVariables, EnvValue>> = {
		[EnvVariables.FORCE_UI_LANG_SYNC]: options.forceUiLangSync,
		[EnvVariables.FEATURES]: options.features,
	};

	(Object.entries(envMapping) as EnvEntry[]).forEach(([key, value]) => {
		if (optionsMapping[key]) setEnvVar(key, optionsMapping[key]);
		if (process.env[key] === undefined && value) setEnvVar(key, value);
	});

	const existingKeys = Object.keys(envMapping).filter((key) => process.env[key]);
	if (existingKeys.length > 0) {
		ChalkLogger.log("Used parameters:");
		existingKeys.forEach((key) => {
			const readableKey = envVariableNames[key as EnvVariables];
			ChalkLogger.log(`  ${readableKey}: "${process.env[key]}"`);
		});
		ChalkLogger.log();
	}
};

const validateBaseUrl = (baseUrl: string | undefined): void => {
	if (!baseUrl) return;

	let url: URL;
	try {
		url = new URL(baseUrl.trim());
	} catch {
		throw new CliUserError(`BaseUrl must be an absolute URL like "https://example.com". Received: "${baseUrl}"`);
	}

	if (!["http", "https"].includes(url.protocol)) {
		throw new CliUserError(`BaseUrl: expected protocol "http" or "https", got "${url.protocol}"`);
	}
};

const buildCommandFunction = async (options: BuildOptions) => {
	const {
		source,
		destination,
		SkipCheck,
		customCss,
		docxTemplates,
		BaseUrl: baseUrl,
		pdfTemplates,
		...configOptions
	} = options;

	const targetDir = new Path(destination);
	const fullPath = resolve(source);
	setRootPath(fullPath);

	await checkExistsPath(fullPath);
	const fp = new DiskFileProvider("");
	if (!(await fp.isFolder(new Path(fullPath)))) throw new CliUserError("The provided path is not a directory.");

	validateBaseUrl(baseUrl);

	const catalogName = basename(fullPath);
	await setEnv(fullPath, configOptions);
	setFeatureList();

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

	const customStyles = await loadCustomStyles(customCss, fp);

	await new StaticSiteBuilder(fp, app, templateHtml).generate(catalog, targetDir, {
		customStyles,
		copyTemplate: {
			copyWordTemplatesFunction: copyWordTemplatesInCli({ fp, catalogName, sourcePath: docxTemplates }),
			copyPdfTemplatesFunction: copyPdfTemplatesInCli({ fp, catalogName, sourcePath: pdfTemplates }),
		},
		baseUrl,
	});
};

export default buildCommandFunction;
