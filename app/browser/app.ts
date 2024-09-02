import resolveModule from "@app/resolveModule/backend";
import { ContextFactory } from "@core/Context/ContextFactory";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import Hash from "@core/Hash/Hash";
import PluginImporterType from "@core/Plugin/PluginImporter/logic/PluginImporterType";
import PluginProvider from "@core/Plugin/logic/PluginProvider";
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
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import HtmlParser from "@ext/html/HtmlParser";
import { mountFSEvents } from "@ext/localization/core/events/FSLocalizationEvents";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import Logger from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import AuthManager from "@ext/security/logic/AuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { AppConfig, getConfig, type AppGlobalConfig } from "../config/AppConfig";
import Application from "../types/Application";

const _init = async (config: AppConfig): Promise<Application> => {
	const am: AuthManager = null;
	const mp: MailProvider = null;
	const vur: VideoUrlRepository = null;

	await resolveModule("initWasm")?.(config.services.cors.url);

	const rp = new RepositoryProvider();

	const fileConfig = await YamlFileConfig.readFromFile<AppGlobalConfig>(
		new DiskFileProvider(config.paths.data),
		new Path("config.yaml"),
	);

	const wm = new WorkspaceManager(
		(path) => new DiskFileProvider(path),
		(fs) => mountFSEvents(fs),
		rp,
		config,
		fileConfig,
	);

	await wm.readWorkspaces();

	const hashes = new Hash();
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
	const pluginProvider = new PluginProvider(wm, htmlParser, cache, PluginImporterType.browser);

	return {
		am,
		tm,
		mp,
		wm,
		vur,
		rp,
		cache,
		logger,
		parser,
		hashes,
		formatter,
		htmlParser,
		tablesManager,
		ticketManager,
		contextFactory,
		sitePresenterFactory,
		parserContextFactory,
		resourceUpdaterFactory,
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
