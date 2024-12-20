import resolveModule from "@app/resolveModule/backend";
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
import MailProvider from "@ext/MailProvider";
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
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import FuseSearcher from "@ext/serach/Fuse/FuseSearcher";
import { IndexDataProvider } from "@ext/serach/IndexDataProvider";
import Searcher from "@ext/serach/Searcher";
import SourceDataProvider from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import setWorkerProxy from "../../apps/browser/src/logic/setWorkerProxy";
import { AppConfig, getConfig, type AppGlobalConfig } from "../config/AppConfig";
import Application from "../types/Application";

const _init = async (config: AppConfig): Promise<Application> => {
	const am: AuthManager = null;
	const mp: MailProvider = null;
	const vur: VideoUrlRepository = null;

	await resolveModule("initWasm")?.(config.services.gitProxy.url);
	await XxHash.init();

	const fileConfig = await YamlFileConfig.readFromFile<AppGlobalConfig>(
		new DiskFileProvider(config.paths.data),
		new Path("config.yaml"),
	);

	const rp = new RepositoryProvider();

	const em = new EnterpriseManager(config.enterprise, fileConfig);

	const wm = new WorkspaceManager(
		(path) => MountFileProvider.fromDefault(new Path(path)),
		(fs) => {
			new FileStructureEventHandlers(fs).mount();
			new RepositoryProviderEventHandlers(fs, rp).mount();
		},
		rp,
		config,
		fileConfig,
	);

	const sdp = new SourceDataProvider(wm);
	rp.addSourceDataProvider(sdp);

	await wm.readWorkspaces();
	const services = wm.maybeCurrent()?.config()?.services ?? config.services;
	setWorkerProxy(services.gitProxy.url);

	const hashes = new HashItemProvider();
	const tm = new ThemeManager();
	const encoder = new Encoder();
	const ticketManager = new TicketManager(wm, encoder, config.tokens.share);
	const parser = new MarkdownParser();
	const formatter = new MarkdownFormatter();
	const tablesManager = new TableDB(parser, wm);
	const customArticlePresenter = new CustomArticlePresenter();

	const parserContextFactory = new ParserContextFactory(config.paths.base, wm, tablesManager, parser, formatter);
	const htmlParser = new HtmlParser(parser, parserContextFactory);
	const logger: Logger = config.isProduction ? new BugsnagLogger(config) : new ConsoleLogger();
	const sitePresenterFactory = new SitePresenterFactory(wm, parser, parserContextFactory, rp, customArticlePresenter);
	const resourceUpdaterFactory = new ResourceUpdaterFactory(parser, parserContextFactory, formatter);

	const contextFactory = new ContextFactory(tm, config.tokens.cookie);

	const cache = new Cache(new DiskFileProvider(config.paths.data));
	const indexDataProvider = new IndexDataProvider(wm, cache, parser, parserContextFactory);
	const searcher: Searcher = new FuseSearcher(indexDataProvider);

	return {
		am,
		tm,
		mp,
		wm,
		em,
		rp,
		vur,
		logger,
		parser,
		hashes,
		searcher,
		formatter,
		htmlParser,
		tablesManager,
		ticketManager,
		contextFactory,
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
