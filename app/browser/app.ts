import resolveModule from "@app/resolveModule/backend";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ContextFactory } from "@core/Context/ContextFactory";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import Hash from "@core/Hash/Hash";
import Library from "@core/Library/Library";
import deleteAnyFolderRule from "@core/Library/Rules/DeleteAnyFolderRule/DeleteAnyFolderRule";
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
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import HtmlParser from "@ext/html/HtmlParser";
import FSLocalizationRules from "@ext/localization/core/rules/FSLocalizationRules";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import Logger from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import AuthManager from "@ext/security/logic/AuthManager";
import Sso from "@ext/security/logic/AuthProviders/Sso";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import { BrowserFileProvider } from "../../apps/browser/src/logic/FileProvider/BrowserFileProvider";
import { AppConfig, getConfig } from "../config/AppConfig";
import Application from "../types/Application";

const _init = async (config: AppConfig): Promise<Application> => {
	const am: AuthManager = null;
	const mp: MailProvider = null;
	const vur: VideoUrlRepository = null;
	const sso: Sso = null;

	await resolveModule("initWasm")?.(config.services.cors.url);

	const rp = new RepositoryProvider({ corsProxy: config.services.cors.url });
	const fp = new DiskFileProvider(config.paths.root);
	await fp.validate();

	const obsoleteFp = getExecutingEnvironment() == "browser" && new BrowserFileProvider(Path.empty);

	const libRules = getExecutingEnvironment() == "browser" ? [deleteAnyFolderRule] : [];
	const lib = new Library(rp, config.isServerApp);
	await lib.addFileProvider(fp, (fs) => FSLocalizationRules.bind(fs), libRules);

	const hashes = new Hash();
	const tm = new ThemeManager();
	const encoder = new Encoder();
	const ticketManager = new TicketManager(lib, encoder, config.tokens.share);
	const parser = new MarkdownParser();
	const formatter = new MarkdownFormatter();
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
	const logger: Logger = new BugsnagLogger(config.bugsnagApiKey);
	const sitePresenterFactory = new SitePresenterFactory(
		lib,
		parser,
		parserContextFactory,
		rp,
		customArticlePresenter,
	);
	const contextFactory = new ContextFactory(tm, config.tokens.cookie);

	const cacheFileProvider = new DiskFileProvider(config.paths.userDataPath);
	const cache = new Cache(cacheFileProvider);
	const pluginProvider = new PluginProvider(lib, htmlParser, cache, PluginImporterType.browser);

	return {
		am,
		tm,
		mp,
		sso,
		lib,
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
		pluginProvider,
		customArticlePresenter,
		obsoleteFp,
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
