import autoPull from "@core/AutoPull/AutoPull";
import { ContextFactory } from "@core/Context/ContextFactory";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructureEventHandlers from "@core/FileStructue/events/FileStuctureEventHandlers";
import Hash from "@core/Hash/Hash";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import { TableDB } from "@core/components/tableDB/table";
import VideoUrlRepository from "@core/components/video/videoUrlRepository";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import Cache from "@ext/Cache";
import { Encoder } from "@ext/Encoder/Encoder";
import MailProvider from "@ext/MailProvider";
import ThemeManager from "@ext/Theme/ThemeManager";
import BlankWatcher from "@ext/Watchers/BlankWatcher";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import HtmlParser from "@ext/html/HtmlParser";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import Logger, { LogLevel } from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import AuthManager from "@ext/security/logic/AuthManager";
import EnterpriseAuth from "@ext/security/logic/AuthProviders/EnterpriseAuth";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import FuseSearcher from "@ext/serach/Fuse/FuseSearcher";
import { IndexDataProvider } from "@ext/serach/IndexDataProvider";
import Searcher from "@ext/serach/Searcher";
import SourceDataProvider from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import EnvAuth from "../../core/extensions/security/logic/AuthProviders/EnvAuth";
import { AppConfig, getConfig } from "../config/AppConfig";
import Application from "../types/Application";

const _init = async (config: AppConfig): Promise<Application> => {
	if (!config.isReadOnly && !config.paths.data) throw new Error(`USER_DATA_PATH not specified`);

	const logger: Logger = config.isProduction ? new BugsnagLogger(config) : new ConsoleLogger();
	logger.setLogLevel(LogLevel.trace);

	const watcher = new BlankWatcher(); // config.isProduction ? new ChokidarWatcher() :

	const rp = new RepositoryProvider();
	const wm = new WorkspaceManager(
		(path) => MountFileProvider.fromDefault(new Path(path), watcher),
		(fs) => new FileStructureEventHandlers(fs).mount(fs),
		rp,
		config,
		YamlFileConfig.dummy(),
	);
	const sdp = new SourceDataProvider(wm);
	rp.addSourceDataProvider(sdp);

	const workspace = await wm.addWorkspace(config.paths.root.value, { name: "Gramax", icon: "layers" });
	await wm.setWorkspace(workspace);

	const formatter = new MarkdownFormatter();

	const encoder = new Encoder();

	const ticketManager = new TicketManager(wm, encoder, config.tokens.share);

	const parser = new MarkdownParser();

	const hashes = new Hash();
	const tablesManager = new TableDB(parser, wm);
	const customArticlePresenter = new CustomArticlePresenter();

	const parserContextFactory = new ParserContextFactory(config.paths.base, wm, tablesManager, parser, formatter);
	const htmlParser = new HtmlParser(parser, parserContextFactory);

	const vur: VideoUrlRepository = null;
	const mp: MailProvider = new MailProvider(config.mail);

	const tm = new ThemeManager();
	const am = new AuthManager(
		config.enterprise.gesUrl
			? new EnterpriseAuth(config.enterprise.gesUrl)
			: new EnvAuth(config.paths.base, config.admin.login, config.admin.password),
		ticketManager,
		config.enterprise.gesUrl,
	);
	const contextFactory = new ContextFactory(tm, config.tokens.cookie, am, config.isReadOnly);
	const sitePresenterFactory = new SitePresenterFactory(wm, parser, parserContextFactory, rp, customArticlePresenter);

	const cacheFileProvider = new DiskFileProvider(config.paths.data);
	await cacheFileProvider.createRootPathIfNeed();
	const cache = new Cache(cacheFileProvider);
	const resourceUpdaterFactory = new ResourceUpdaterFactory(parser, parserContextFactory, formatter);

	const indexDataProvider = new IndexDataProvider(wm, cache, parser, parserContextFactory);
	const searcher: Searcher = new FuseSearcher(indexDataProvider);

	return {
		tm,
		am,
		mp,
		rp,
		wm,
		vur,
		cache,
		parser,
		logger,
		hashes,
		searcher,
		formatter,
		htmlParser,
		ticketManager,
		tablesManager,
		contextFactory,
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

			version: config.version,
			buildVersion: config.buildVersion,
			bugsnagApiKey: config.bugsnagApiKey,
			yandexMetricCounter: config.yandexMetricCounter,
			services: config.services,
			enterprise: config.enterprise,

			logo: config.logo,
		},
	};
};

const getApp = async (): Promise<Application> => {
	if (global.app) return global.app;
	global.app = await _init(getConfig());
	autoPull(global.app);
	return global.app;
};

export default getApp;
