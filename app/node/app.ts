import { initBackendModules } from "@app/resolveModule/backend";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import autoPull from "@core/AutoPull/AutoPull";
import { ContextFactory } from "@core/Context/ContextFactory";
import { TableDB } from "@core/components/tableDB/table";
import type VideoUrlRepository from "@core/components/video/videoUrlRepository";
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
import { Encoder } from "@ext/Encoder/Encoder";
import EnterpriseManager from "@ext/enterprise/EnterpriseManager";
import { EnterpriseWorkspace } from "@ext/enterprise/EnterpriseWorkspace";
import MergeNotificationHandler from "@ext/enterprise/notifications/MergeNotificationHandler";
import RepositoryProviderEventHandlers from "@ext/git/core/Repository/events/RepositoryProviderEventHandlers";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import HtmlParser from "@ext/html/HtmlParser";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import type Logger from "@ext/loggers/Logger";
import { LogLevel } from "@ext/loggers/Logger";
import { registerOtel } from "@ext/loggers/opentelemetry/registerOtel";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type AuthManager from "@ext/security/logic/AuthManager";
import EnterpriseAuth from "@ext/security/logic/AuthProviders/EnterpriseAuth";
import ServerAuthManager from "@ext/security/logic/ServerAuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import { createNodeSearcherManager } from "@ext/serach/createSearcherManager";
import { SourceDataProvider } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import ThemeManager from "@ext/Theme/ThemeManager";
import { feature } from "@ext/toggleFeatures/features";
import BlankWatcher from "@ext/Watchers/BlankWatcher";
import { PdfTemplateManager } from "@ext/wordExport/PdfTemplateManager";
import { WordTemplateManager } from "@ext/wordExport/WordTemplateManager";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import EnvAuth from "../../core/extensions/security/logic/AuthProviders/EnvAuth";
import FSTemplateEvents from "../../core/extensions/templates/logic/FSTemplateEvents";
import { type AppConfig, getConfig } from "../config/AppConfig";
import type Application from "../types/Application";

const _init = async (config: AppConfig): Promise<Application> => {
	if (feature("opentelemetry-logs")) await registerOtel();
	await initBackendModules();
	if (!config.isReadOnly && !config.paths.data) throw new Error(`USER_DATA_PATH not specified`);

	const logger: Logger =
		config.isProduction && getExecutingEnvironment() !== "cli"
			? await BugsnagLogger.init(config)
			: new ConsoleLogger();
	logger.setLogLevel(LogLevel.trace);

	await XxHash.init();

	const watcher = new BlankWatcher(); // config.isProduction ? new ChokidarWatcher() :

	const em = new EnterpriseManager(config.enterprise);

	const rp = new RepositoryProvider(config);

	const templateEventHandlers: FSTemplateEvents = new FSTemplateEvents();
	const parser = new MarkdownParser();
	const formatter = new MarkdownFormatter();
	const tablesManager = new TableDB(parser);
	const parserContextFactory = new ParserContextFactory(config.paths.base, tablesManager, parser, formatter, rp);

	const wm = new WorkspaceManager(
		(path) => MountFileProvider.fromDefault(new Path(path), watcher),
		(fs) => {
			new FileStructureEventHandlers(fs).mount();
			new RepositoryProviderEventHandlers(fs, rp).mount();
			templateEventHandlers.mount(fs);
		},
		(workspace) => {
			if (workspace instanceof EnterpriseWorkspace) {
				return [new MergeNotificationHandler(workspace, parser, parserContextFactory)];
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

	const encoder = new Encoder();

	const ticketManager = new TicketManager(encoder, config.tokens.share);

	const hashes = new HashItemProvider();
	const customArticlePresenter = new CustomArticlePresenter();
	const htmlParser = new HtmlParser(parser, parserContextFactory);

	templateEventHandlers.withParser(parser, formatter, parserContextFactory);

	const vur: VideoUrlRepository = null;

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

	const searchResourcesEnabled = Boolean(enterpriseConfig.gesUrl);
	const { aiAvailable, searcherManager } = await createNodeSearcherManager({
		config,
		wm,
		parser,
		parserContextFactory,
		searchResourcesEnabled,
	});

	const workspaceConfig = await wm.maybeCurrent()?.config();

	const wtm = new WordTemplateManager(wm);
	const ptm = new PdfTemplateManager(wm);

	return {
		tm,
		am,
		rp,
		wm,
		em,
		vur,
		adp,
		wtm,
		ptm,
		parser,
		logger,
		hashes,
		formatter,
		htmlParser,
		ticketManager,
		tablesManager,
		contextFactory,
		searcherManager,
		parserContextFactory,
		sitePresenterFactory,
		customArticlePresenter,
		resourceUpdaterFactory,
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

			search: {
				resourcesEnabled: searchResourcesEnabled,
			},

			forceUiLangSync: config.forceUiLangSync,
		},
	};
};

const getApp = (): Promise<Application> => {
	if (!global.app) {
		global.app = _init(getConfig());
		if (getExecutingEnvironment() !== "cli") void autoPull(global.app);
	}
	return global.app;
};

export default getApp;
