import { initBackendModules } from "@app/resolveModule/backend";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import initAutoPull from "@core/AutoPull/AutoPull";
import { ContextFactory } from "@core/Context/ContextFactory";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructureEventHandlers from "@core/FileStructue/events/FileStuctureEventHandlers";
import { XxHash } from "@core/Hash/Hasher";
import HashItemProvider from "@core/Hash/HashItemProvider";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import { AiDataProvider } from "@ext/ai/logic/AiDataProvider";
import EnterpriseManager from "@ext/enterprise/EnterpriseManager";
import { EnterpriseWorkspace } from "@ext/enterprise/EnterpriseWorkspace";
import EnterpriseLfsResolver from "@ext/enterprise/events/EnterpriseLfsResolver";
import MergeNotificationHandler from "@ext/enterprise/notifications/MergeNotificationHandler";
import { GesCloudManager } from "@ext/enterprise-cloud/GesCloudManager";
import RepositoryProviderEventHandlers from "@ext/git/core/Repository/events/RepositoryProviderEventHandlers";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import type Logger from "@ext/loggers/Logger";
import { LogLevel } from "@ext/loggers/Logger";
import { registerOtel } from "@ext/loggers/opentelemetry/registerOtel";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import ParserEventHandlers from "@ext/markdown/core/Parser/events/ParserEventHandlers";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type AuthManager from "@ext/security/logic/AuthManager";
import EnterpriseAuth from "@ext/security/logic/AuthProviders/EnterpriseAuth";
import ServerAuthManager from "@ext/security/logic/ServerAuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import { createNodeSearcherManager } from "@ext/serach/createSearcherManager";
import { SourceDataProvider } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import ThemeManager from "@ext/Theme/ThemeManager";
import { TableDB } from "@ext/tableDB/table";
import { feature } from "@ext/toggleFeatures/features";
import { PdfTemplateManager } from "@ext/wordExport/PdfTemplateManager";
import { WordTemplateManager } from "@ext/wordExport/WordTemplateManager";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import EnvAuth from "../../core/extensions/security/logic/AuthProviders/EnvAuth";
import FSTemplateEvents from "../../core/extensions/templates/logic/FSTemplateEvents";
import { type AppConfig, getConfig } from "../config/AppConfig";
import type Application from "../types/Application";

const init = async (config: AppConfig): Promise<Application> => {
	if (feature("opentelemetry-logs")) await registerOtel();
	await initBackendModules();
	if (!config.isReadOnly && !config.paths.data) throw new Error(`USER_DATA_PATH not specified`);

	const logger: Logger =
		config.isProduction && getExecutingEnvironment() !== "cli"
			? await BugsnagLogger.init(config)
			: new ConsoleLogger();
	logger.setLogLevel(LogLevel.trace);

	await XxHash.init();

	const em = new EnterpriseManager(config.enterprise);

	const rp = new RepositoryProvider(config);

	const templateEventHandlers: FSTemplateEvents = new FSTemplateEvents();

	const parser = new MarkdownParser();
	new ParserEventHandlers(parser).mount();

	const formatter = new MarkdownFormatter();
	const tablesManager = new TableDB(parser);
	const parserContextFactory = new ParserContextFactory(config.paths.base, tablesManager, parser, formatter, rp);

	const wm = new WorkspaceManager(
		(path) => MountFileProvider.fromDefault(new Path(path)),
		(fs) => {
			new FileStructureEventHandlers(fs).mount();
			new RepositoryProviderEventHandlers(fs, rp).mount();
			templateEventHandlers.mount(fs);
		},
		(workspace) => {
			if (workspace instanceof EnterpriseWorkspace) {
				return [
					new MergeNotificationHandler(workspace, parser, parserContextFactory),
					new EnterpriseLfsResolver(workspace),
				];
			}
			return [];
		},
		rp,
		config,
		YamlFileConfig.dummy(),
	);
	tablesManager.mountWorkspaceManager(wm); // TODO: remove
	parserContextFactory.mountWorkspaceManager(wm); // TODO: remove

	const sdp = new SourceDataProvider(wm);
	rp.addSourceDataProvider(sdp);

	const adp = new AiDataProvider(wm);

	const enterpriseConfig = em.getConfig();
	const workspace = await wm.addWorkspace(config.paths.root.value, {
		name: "Gramax",
		icon: "layers",
		enterprise: enterpriseConfig.gesUrl ? { ...enterpriseConfig, lastUpdateDate: 0 } : {},
	});
	await wm.setWorkspace(workspace);

	const ticketManager = new TicketManager(config.tokens.share);

	const hashes = new HashItemProvider();
	const customArticlePresenter = new CustomArticlePresenter();

	templateEventHandlers.withParser(parser, formatter, parserContextFactory);

	const tm = new ThemeManager();
	const ap = enterpriseConfig?.gesUrl
		? new EnterpriseAuth(config.paths.base, em, () => wm.current())
		: new EnvAuth(config.paths.base, config.admin.login, config.admin.password);
	const am: AuthManager = new ServerAuthManager(em, ap, ticketManager);
	const contextFactory = new ContextFactory(tm, config.tokens.cookie, am);
	const sitePresenterFactory = new SitePresenterFactory(
		wm,
		parser,
		parserContextFactory,
		rp,
		customArticlePresenter,
		config.isReadOnly,
	);

	const resourceUpdaterFactory = new ResourceUpdaterFactory(parser, parserContextFactory, formatter);

	const { aiAvailable, searcherManager } = await createNodeSearcherManager({
		config,
		wm,
		parser,
		parserContextFactory,
	});

	const workspaceConfig = await wm.maybeCurrent()?.config();

	const wtm = new WordTemplateManager(wm);
	const ptm = new PdfTemplateManager(wm);

	const enterpriseCloudManager = new GesCloudManager(config.enterpriseCloud);

	return {
		tm,
		am,
		rp,
		wm,
		em,
		adp,
		wtm,
		ptm,
		parser,
		logger,
		hashes,
		formatter,
		ticketManager,
		tablesManager,
		contextFactory,
		searcherManager,
		parserContextFactory,
		sitePresenterFactory,
		customArticlePresenter,
		resourceUpdaterFactory,
		enterpriseCloudManager,
		conf: {
			basePath: config.paths.base,
			disableSeo: config.disableSeo,

			isRelease: config.isRelease,
			isReadOnly: config.isReadOnly,
			isProduction: config.isProduction,

			metrics: config.metrics,
			version: config.version,
			buildVersion: config.buildVersion,
			bugsnagApiKey: config.bugsnagApiKey,
			services: workspaceConfig?.services ?? config.services,

			logo: config.logo,

			allowedOrigins: config.allowedGramaxUrls,

			portalAi: { enabled: aiAvailable },

			forceUiLangSync: config.forceUiLangSync,
		},
	};
};

const getApp = (): Promise<Application> => {
	if (!global.app) {
		global.app = init(getConfig());
		if (getExecutingEnvironment() !== "cli") void initAutoPull(global.app);
	}
	return global.app;
};

export default getApp;
