import { initModules } from "@app/resolveModule/backend";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { initModules as initModulesFrontend } from "@app/resolveModule/frontend";
import autoPull from "@core/AutoPull/AutoPull";
import { ContextFactory } from "@core/Context/ContextFactory";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructureEventHandlers from "@core/FileStructue/events/FileStuctureEventHandlers";
import HashItemProvider from "@core/Hash/HashItemProvider";
import { XxHash } from "@core/Hash/Hasher";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import { TableDB } from "@core/components/tableDB/table";
import VideoUrlRepository from "@core/components/video/videoUrlRepository";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import Cache from "@ext/Cache";
import { Encoder } from "@ext/Encoder/Encoder";
import ThemeManager from "@ext/Theme/ThemeManager";
import BlankWatcher from "@ext/Watchers/BlankWatcher";
import { AiDataProvider } from "@ext/ai/logic/AiDataProvider";
import EnterpriseManager from "@ext/enterprise/EnterpriseManager";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import RepositoryProviderEventHandlers from "@ext/git/core/Repository/events/RepositoryProviderEventHandlers";
import HtmlParser from "@ext/html/HtmlParser";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import Logger, { LogLevel } from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import AuthManager from "@ext/security/logic/AuthManager";
import EnterpriseAuth from "@ext/security/logic/AuthProviders/EnterpriseAuth";
import ServerAuthManager from "@ext/security/logic/ServerAuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import FuseSearcher from "@ext/serach/Fuse/FuseSearcher";
import { IndexDataProvider } from "@ext/serach/IndexDataProvider";
import SearcherManager from "@ext/serach/SearcherManager";
import VectorChatBotSearcher from "@ext/serach/vector/VectorChatBotSearcher";
import VectorDatabaseClient from "@ext/serach/vector/VectorDatabaseClient";
import { VectorSearcher } from "@ext/serach/vector/VectorSearcher";
import { SourceDataProvider } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import { PdfTemplateManager } from "@ext/wordExport/PdfTemplateManager";
import { WordTemplateManager } from "@ext/wordExport/WordTemplateManager";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import EnvAuth from "../../core/extensions/security/logic/AuthProviders/EnvAuth";
import FSTemplateEvents from "../../core/extensions/templates/logic/FSTemplateEvents";
import { AppConfig, getConfig } from "../config/AppConfig";
import Application from "../types/Application";

const _init = async (config: AppConfig): Promise<Application> => {
	await initModulesFrontend();
	await initModules();
	if (!config.isReadOnly && !config.paths.data) throw new Error(`USER_DATA_PATH not specified`);

	const logger: Logger = config.isProduction ? await BugsnagLogger.init(config) : new ConsoleLogger();
	logger.setLogLevel(LogLevel.trace);

	await XxHash.init();

	const watcher = new BlankWatcher(); // config.isProduction ? new ChokidarWatcher() :

	const em = new EnterpriseManager(config.enterprise);

	const rp = new RepositoryProvider(config);

	const templateEventHandlers: FSTemplateEvents = new FSTemplateEvents();

	const wm = new WorkspaceManager(
		(path) => MountFileProvider.fromDefault(new Path(path), watcher),
		(fs) => {
			new FileStructureEventHandlers(fs).mount();
			new RepositoryProviderEventHandlers(fs, rp).mount();
			templateEventHandlers.mount(fs);
		},
		() => {},
		rp,
		config,
		YamlFileConfig.dummy(),
	);

	const sdp = new SourceDataProvider(wm);
	rp.addSourceDataProvider(sdp);

	const adp = new AiDataProvider(wm);

	const enterpriseConfig = em.getConfig();
	const workspace = await wm.addWorkspace(config.paths.root.value, {
		name: "Gramax",
		icon: "layers",
		enterprise: enterpriseConfig.gesUrl ? { ...enterpriseConfig, lastUpdateDate: Date.now() } : {},
	});
	await wm.setWorkspace(workspace);

	const formatter = new MarkdownFormatter();

	const encoder = new Encoder();

	const ticketManager = new TicketManager(encoder, config.tokens.share, enterpriseConfig);

	const parser = new MarkdownParser();

	const hashes = new HashItemProvider();
	const tablesManager = new TableDB(parser, wm);
	const customArticlePresenter = new CustomArticlePresenter();

	const parserContextFactory = new ParserContextFactory(config.paths.base, wm, tablesManager, parser, formatter);
	const htmlParser = new HtmlParser(parser, parserContextFactory);

	templateEventHandlers.withParser(parser, formatter, parserContextFactory);

	const vur: VideoUrlRepository = null;

	const tm = new ThemeManager();
	const am: AuthManager = new ServerAuthManager(
		enterpriseConfig?.gesUrl
			? new EnterpriseAuth(enterpriseConfig, () => wm.current(), config.paths.base)
			: new EnvAuth(config.paths.base, config.admin.login, config.admin.password),
		ticketManager,
		enterpriseConfig,
	);
	const contextFactory = new ContextFactory(tm, config.tokens.cookie, config.isReadOnly, am);
	const sitePresenterFactory = new SitePresenterFactory(
		wm,
		parser,
		parserContextFactory,
		rp,
		customArticlePresenter,
		config.isReadOnly,
	);

	const cacheFileProvider = new DiskFileProvider(config.paths.data);
	await cacheFileProvider.createRootPathIfNeed();
	const cache = new Cache(cacheFileProvider);
	const resourceUpdaterFactory = new ResourceUpdaterFactory(parser, parserContextFactory, formatter);

	const indexDataProvider = new IndexDataProvider(wm, cache, parser, parserContextFactory);

	const vectorDatabaseClient = config.portalAi.enabled
		? new VectorDatabaseClient(
				{
					apiUrl: config.portalAi.apiUrl,
					apiKey: config.portalAi.token,
					collectionName: config.portalAi.instanceName,
				},
				wm,
				parser,
				parserContextFactory,
		  )
		: null;

	const aiAvailable = config.portalAi.enabled ? await vectorDatabaseClient.checkConnection() : false;

	const searcherManager = new SearcherManager(
		new FuseSearcher(indexDataProvider),
		vectorDatabaseClient ? new VectorChatBotSearcher(vectorDatabaseClient, wm) : null,
		{
			vector: vectorDatabaseClient ? new VectorSearcher(vectorDatabaseClient) : null,
		},
	);

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
		indexDataProvider,
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
				elastic: {
					enabled: config.search.elastic.enabled,
					apiUrl: config.search.elastic.apiUrl,
					instanceName: config.search.elastic.instanceName,
					username: config.search.elastic.username,
					password: config.search.elastic.password,
				},
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
