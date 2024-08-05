import autoPull from "@core/AutoPull/AutoPull";
import { ContextFactory } from "@core/Context/ContextFactory";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import Hash from "@core/Hash/Hash";
import PluginImporterType from "@core/Plugin/PluginImporter/logic/PluginImporterType";
import PluginProvider from "@core/Plugin/logic/PluginProvider";
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
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import EnvAuth from "../../core/extensions/security/logic/AuthProviders/EnvAuth";
import { AppConfig, getConfig } from "../config/AppConfig";
import Application from "../types/Application";

const _init = async (config: AppConfig): Promise<Application> => {
	if (!config.isServerApp && !config.paths.data) throw new Error(`USER_DATA_PATH not specified`);

	const logger: Logger = config.isProduction ? new BugsnagLogger(config) : new ConsoleLogger();
	logger.setLogLevel(LogLevel.trace);

	const watcher = new BlankWatcher(); // config.isProduction ? new ChokidarWatcher() :

	const sso = new Sso(config.services.sso.url);

	const rp = new RepositoryProvider();

	const wm = new WorkspaceManager(
		(path) => new DiskFileProvider(new Path(path), watcher),
		(fs) => FSLocalizationRules.bind(fs),
		rp,
		config,
		YamlFileConfig.dummy(),
	);

	const workspace = await wm.addWorkspace(config.paths.root.value, { name: "Gramax", icon: "layers" });
	await wm.setWorkspace(workspace);

	const formatter = new MarkdownFormatter();

	const envAuth = new EnvAuth(config.paths.base, config.admin.login, config.admin.password);
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
	const am = new AuthManager(envAuth, ticketManager);
	const contextFactory = new ContextFactory(tm, config.tokens.cookie, am, config.isServerApp);
	const sitePresenterFactory = new SitePresenterFactory(wm, parser, parserContextFactory, rp, customArticlePresenter);

	const cacheFileProvider = new DiskFileProvider(config.paths.data);
	await cacheFileProvider.createRootPathIfNeed();
	const cache = new Cache(cacheFileProvider);
	const pluginProvider = new PluginProvider(wm, htmlParser, cache, PluginImporterType.next);

	return {
		tm,
		am,
		mp,
		sso,
		rp,
		wm,
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
			glsUrl: config.glsUrl,
			isRelease: config.isRelease,
			basePath: config.paths.base,

			isReadOnly: config.isReadOnly,
			isServerApp: config.isServerApp,
			isProduction: config.isProduction,

			version: config.version,
			buildVersion: config.buildVersion,
			bugsnagApiKey: config.bugsnagApiKey,
			yandexMetricCounter: config.yandexMetricCounter,
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
