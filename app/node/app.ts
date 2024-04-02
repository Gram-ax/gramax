import autoPull from "@core/AutoPull/AutoPull";
import { ContextFactory } from "@core/Context/ContextFactory";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Hash from "@core/Hash/Hash";
import Library from "@core/Library/Library";
import PluginImporterType from "@core/Plugin/PluginImporter/logic/PluginImporterType";
import PluginProvider from "@core/Plugin/logic/PluginProvider";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import { TableDB } from "@core/components/tableDB/table";
import VideoUrlRepository from "@core/components/video/videoUrlRepository";
import Cache from "@ext/Cache";
import { Encoder } from "@ext/Encoder/Encoder";
import MailProvider from "@ext/MailProvider";
import ThemeManager from "@ext/Theme/ThemeManager";
import BlankWatcher from "@ext/Watchers/BlankWatcher";
import ChokidarWatcher from "@ext/Watchers/ChokidarWatcher";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import HtmlParser from "@ext/html/HtmlParser";
import FSLocalizationRules from "@ext/localization/core/rules/FSLocalizationRules";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import Logger, { LogLevel } from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import AuthManager from "@ext/security/logic/AuthManager";
import Sso from "@ext/security/logic/AuthProviders/Sso";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import EnvAuth from "../../core/extensions/security/logic/AuthProviders/EnvAuth";
import { AppConfig, getConfig } from "../config/AppConfig";
import Application from "../types/Application";

const _init = async (config: AppConfig): Promise<Application> => {
	if (!config.isServerApp && !config.paths.userDataPath) throw new Error(`Необходимо указать USER_DATA_PATH`);

	const logger: Logger = config.isProduction ? new BugsnagLogger(config.bugsnagApiKey) : new ConsoleLogger();
	logger.setLogLevel(LogLevel.trace);

	const watcher = config.isProduction ? new ChokidarWatcher() : new BlankWatcher();
	const fp = new DiskFileProvider(config.paths.root, watcher);
	await fp.validate();

	const sso = new Sso(config.services.sso.url);

	const rp = new RepositoryProvider({ corsProxy: config.services.cors.url });

	const lib = new Library(rp, config.isServerApp);

	await lib.addFileProvider(fp, (fs) => FSLocalizationRules.bind(fs));

	const formatter = new MarkdownFormatter();

	const envAuth = new EnvAuth(config.paths.base, config.admin.login, config.admin.password);
	const encoder = new Encoder();

	const ticketManager = new TicketManager(lib, encoder, config.tokens.share);

	const parser = new MarkdownParser();

	const hashes = new Hash();
	const tablesManager = new TableDB(parser, lib);
	const customArticlePresenter = new CustomArticlePresenter();

	const parserContextFactory = new ParserContextFactory(
		config.paths.base,
		fp,
		tablesManager,
		parser,
		formatter,
		config.services.sso.url,
		config.services.diagramRenderer.url,
	);
	const htmlParser = new HtmlParser(parser, parserContextFactory);

	const vur: VideoUrlRepository = null;
	const mp: MailProvider = new MailProvider(config.mail);

	const tm = new ThemeManager();
	const am = new AuthManager(envAuth, ticketManager);
	const contextFactory = new ContextFactory(tm, config.tokens.cookie, am, config.isServerApp);
	const sitePresenterFactory = new SitePresenterFactory(
		lib,
		parser,
		parserContextFactory,
		rp,
		customArticlePresenter,
	);

	const cacheFileProvider = new DiskFileProvider(config.paths.userDataPath);
	await cacheFileProvider.validate();
	const cache = new Cache(cacheFileProvider);
	const pluginProvider = new PluginProvider(lib, htmlParser, cache, PluginImporterType.next);

	return {
		tm,
		am,
		mp,
		sso,
		rp,
		lib,
		vur,
		cache,
		parser,
		logger,
		hashes,
		formatter,
		htmlParser,
		ticketManager,
		tablesManager,
		contextFactory,
		parserContextFactory,
		sitePresenterFactory,
		pluginProvider,
		customArticlePresenter,
		conf: {
			services: config.services,

			isRelease: config.isRelease,
			basePath: config.paths.base,

			isReadOnly: config.isReadOnly,
			isServerApp: config.isServerApp,
			isProduction: config.isProduction,

			bugsnagApiKey: config.bugsnagApiKey,
			version: config.version,
		},
	};
};

let app: Application = null;
const getApp = async (): Promise<Application> => {
	if (app) return app;
	app = await _init(getConfig());
	autoPull(app);
	return app;
};

export default getApp;
