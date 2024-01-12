import { ContextFactory } from "@core/Context/ContextFactory";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Hash from "@core/Hash/Hash";
import Library from "@core/Library/Library";
import ErrorArticlePresenter from "@core/SitePresenter/ErrorArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import { TableDB } from "@core/components/tableDB/table";
import VideoUrlRepository from "@core/components/video/videoUrlRepository";
import { Encoder } from "@ext/Encoder/Encoder";
import MailProvider from "@ext/MailProvider";
import ThemeManager from "@ext/Theme/ThemeManager";
import ChokidarWatcher from "@ext/Watchers/ChokidarWatcher";
import ProductionWatcher from "@ext/Watchers/ProductionWatcher";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import FSLocalizationRules from "@ext/localization/core/rules/FSLocalizationRules";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import Logger, { LogLevel } from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import IndexCacheProvider from "@ext/search/IndexCacheProvider";
import LunrSearcher from "@ext/search/Lunr/Searcher";
import Searcher from "@ext/search/Searcher";
import AuthManager from "@ext/security/logic/AuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import EnvAuth from "../../core/extensions/security/logic/AuthProviders/EnvAuth";
import { AppConfig } from "../config/AppConfig";
import Application from "../types/Application";
import configure from "./configure";

const _init = async (config: AppConfig): Promise<Application> => {
	if (!config.isServerApp && !config.paths.userData) throw new Error(`Необходимо указать USER_DATA_PATH`);

	const logger: Logger = config.isProduction ? new BugsnagLogger(config.bugsnagApiKey) : new ConsoleLogger();
	logger.setLogLevel(LogLevel.trace);

	const watcher = config.isServerApp ? new ProductionWatcher() : new ChokidarWatcher();
	const fp = new DiskFileProvider(config.paths.root, watcher);
	await fp.validate();

	const corsProxy = config.isServerApp
		? null
		: config.enterpriseServerUrl && `${config.enterpriseServerUrl}/cors-proxy`;

	const rp = new RepositoryProvider({ corsProxy });

	const lib = new Library(rp);

	await lib.addFileProvider(fp, (fs) => FSLocalizationRules.bind(fs));

	if (config.paths.local) {
		const fp = new DiskFileProvider(config.paths.local, watcher);
		await fp.validate();
		await lib.addFileProvider(fp);
	}

	const formatter = new MarkdownFormatter();

	const envAuth = new EnvAuth(config.paths.base, config.adminLogin, config.adminPassword);
	const encoder = new Encoder();

	const ticketManager = new TicketManager(lib, encoder, config.tokens.share);

	const parser = new MarkdownParser();

	const hashes = new Hash();
	const tablesManager = new TableDB(parser, lib);
	const errorArticlesProvider = new ErrorArticlePresenter();

	const cacheFileProvider = new DiskFileProvider(config.paths.cache);
	await cacheFileProvider.validate();
	const indexCacheProvider = new IndexCacheProvider(cacheFileProvider);

	const parserContextFactory = new ParserContextFactory(
		config.paths.base,
		fp,
		tablesManager,
		parser,
		formatter,
		config.enterpriseServerUrl,
	);

	const searcher: Searcher = new LunrSearcher(lib, parser, parserContextFactory, indexCacheProvider);
	const vur: VideoUrlRepository = null;
	const mp: MailProvider = new MailProvider(config.mail);

	const tm = new ThemeManager();
	const am = new AuthManager(envAuth, ticketManager);
	const contextFactory = new ContextFactory(tm, config.cookieSecret, am, config.isServerApp);
	const sitePresenterFactory = new SitePresenterFactory(
		lib,
		parser,
		parserContextFactory,
		searcher,
		rp,
		errorArticlesProvider,
	);

	return {
		tm,
		am,
		mp,
		rp,
		lib,
		vur,
		parser,
		logger,
		hashes,
		searcher,
		formatter,
		ticketManager,
		tablesManager,
		contextFactory,
		parserContextFactory,
		sitePresenterFactory,
		errorArticlesProvider,
		conf: {
			branch: config.branch,
			basePath: config.paths.base,
			isServerApp: config.isServerApp,
			isProduction: config.isProduction,
			isReadOnly: config.isReadOnly,
			ssoServerUrl: config.ssoServerUrl,
			ssoPublicKey: config.ssoPublicKey,
			enterpriseServerUrl: config.enterpriseServerUrl,
			corsProxy: corsProxy,
			bugsnagApiKey: config.bugsnagApiKey,
			gramaxVersion: config.gramaxVersion,
		},
	};
};

const getApp = async (): Promise<Application> => {
	if (global.app) return global.app;
	const config = configure();
	global.app = await _init(config);
	return global.app;
};

export default getApp;
