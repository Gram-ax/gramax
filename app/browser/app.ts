import resolveModule, { initModules } from "@app/resolveModule/backend";
import { initModules as initModulesFrontend } from "@app/resolveModule/frontend";
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
import EnterpriseManager from "@ext/enterprise/EnterpriseManager";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import RepositoryProviderEventHandlers from "@ext/git/core/Repository/events/RepositoryProviderEventHandlers";
import HtmlParser from "@ext/html/HtmlParser";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import Logger from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import AuthManager from "@ext/security/logic/AuthManager";
import ClientAuthManager from "@ext/security/logic/ClientAuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import FuseSearcher from "@ext/serach/Fuse/FuseSearcher";
import { IndexDataProvider } from "@ext/serach/IndexDataProvider";
import SearcherManager from "@ext/serach/SearcherManager";
import WorkspaceCheckIsCatalogCloning from "@ext/storage/events/WorkspaceCheckIsCatalogCloning";
import { SourceDataProvider } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import FSTemplateEvents from "@ext/templates/logic/FSTemplateEvents";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import setWorkerProxy from "../../apps/browser/src/logic/setWorkerProxy";
import { AppConfig, getConfig, type AppGlobalConfig } from "../config/AppConfig";
import Application from "../types/Application";
import { AiDataProvider } from "@ext/ai/logic/AiDataProvider";
import { WordTemplateManager } from "@ext/wordExport/WordTemplateManager";

const _init = async (config: AppConfig): Promise<Application> => {
	await initModulesFrontend();
	await initModules();

	const vur: VideoUrlRepository = null;

	const initWasm = resolveModule("initWasm");

	await initWasm?.(config.services.gitProxy.url);
	await XxHash.init();

	const fileConfig = await YamlFileConfig.readFromFile<AppGlobalConfig>(
		new DiskFileProvider(config.paths.data),
		new Path("config.yaml"),
	);

	const rp = new RepositoryProvider(config);

	const em = new EnterpriseManager(config.enterprise, fileConfig);

	const templateEventHandlers = new FSTemplateEvents();

	const wm = new WorkspaceManager(
		(path) => MountFileProvider.fromDefault(new Path(path)),
		(fs) => {
			new FileStructureEventHandlers(fs).mount();
			new RepositoryProviderEventHandlers(fs, rp).mount();
			templateEventHandlers.mount(fs);
		},
		(workspace) => new WorkspaceCheckIsCatalogCloning(workspace, rp).mount(),
		rp,
		config,
		fileConfig,
	);

	const sdp = new SourceDataProvider(wm);
	rp.addSourceDataProvider(sdp);

	const adp = new AiDataProvider(wm);

	await wm.readWorkspaces();
	const workspaceConfig = await wm.maybeCurrent()?.config();
	const services = workspaceConfig?.services ?? config.services;
	setWorkerProxy(services.gitProxy.url);

	const hashes = new HashItemProvider();
	const tm = new ThemeManager();
	const encoder = new Encoder();
	const ticketManager = new TicketManager(encoder, config.tokens.share);
	const parser = new MarkdownParser();
	const formatter = new MarkdownFormatter();
	const tablesManager = new TableDB(parser, wm);
	const customArticlePresenter = new CustomArticlePresenter();

	const parserContextFactory = new ParserContextFactory(config.paths.base, wm, tablesManager, parser, formatter);
	const htmlParser = new HtmlParser(parser, parserContextFactory);
	const logger: Logger = config.isProduction ? new BugsnagLogger(config) : new ConsoleLogger();
	const sitePresenterFactory = new SitePresenterFactory(wm, parser, parserContextFactory, rp, customArticlePresenter, config.isReadOnly);
	const resourceUpdaterFactory = new ResourceUpdaterFactory(parser, parserContextFactory, formatter);

	const am: AuthManager = em.getConfig().gesUrl ? new ClientAuthManager(em.getConfig().gesUrl) : null;
	const contextFactory = new ContextFactory(tm, config.tokens.cookie, config.isReadOnly, am);

	const cache = new Cache(new DiskFileProvider(config.paths.data));
	const indexDataProvider = new IndexDataProvider(wm, cache, parser, parserContextFactory);
	const searcherManager = new SearcherManager(new FuseSearcher(indexDataProvider));
	const wtm = new WordTemplateManager(wm);

	templateEventHandlers.withParser(parser, formatter, parserContextFactory);

	return {
		am,
		tm,
		wm,
		em,
		rp,
		vur,
		adp,
		wtm,
		logger,
		parser,
		hashes,
		formatter,
		htmlParser,
		tablesManager,
		ticketManager,
		contextFactory,
		searcherManager,
		indexDataProvider,
		sitePresenterFactory,
		parserContextFactory,
		resourceUpdaterFactory,
		customArticlePresenter,
		conf: {
			services,
			logo: config.logo,

			basePath: config.paths.base,
			disableSeo: config.disableSeo,

			isRelease: config.isRelease,
			isReadOnly: config.isReadOnly,
			isProduction: config.isProduction,

			metrics: config.metrics,
			version: config.version,
			buildVersion: config.buildVersion,
			bugsnagApiKey: config.bugsnagApiKey,

			portalAi: {
				enabled: false,
			},

			search: {
				elastic: { enabled: false },
			},
		},
	};
};

const container = window as {
	app?: Application;
};

const getApp = async (): Promise<Application> => {
	if (container.app) return container.app;
	const config = getConfig();
	container.app = await _init(config);
	return container.app;
};

export default getApp;
