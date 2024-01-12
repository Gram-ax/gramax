import { ContextFactory } from "@core/Context/ContextFactory";
import Hash from "@core/Hash/Hash";
import Library from "@core/Library/Library";
import deleteAnyFolderRule from "@core/Library/Rules/DeleteAnyFolderRule/DeleteAnyFolderRule";
import ErrorArticlePresenter from "@core/SitePresenter/ErrorArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import { TableDB } from "@core/components/tableDB/table";
import VideoUrlRepository from "@core/components/video/videoUrlRepository";
import { Encoder } from "@ext/Encoder/Encoder";
import MailProvider from "@ext/MailProvider";
import ThemeManager from "@ext/Theme/ThemeManager";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import FSLocalizationRules from "@ext/localization/core/rules/FSLocalizationRules";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import Logger from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import IndexCacheProvider from "@ext/search/IndexCacheProvider";
import LunrSearcher from "@ext/search/Lunr/Searcher";
import Searcher from "@ext/search/Searcher";
import AuthManager from "@ext/security/logic/AuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import { AppConfig } from "../config/AppConfig";
import resolveModule, { getExecutingEnvironment } from "../resolveModule";
import Application from "../types/Application";
import configure from "./configure";

const _init = async (config: AppConfig): Promise<Application> => {
	const am: AuthManager = null;
	const mp: MailProvider = null;
	const vur: VideoUrlRepository = null;

	const corsProxy = config.isServerApp
		? null
		: config.enterpriseServerUrl && `${config.enterpriseServerUrl}/cors-proxy`;
	const rp = new RepositoryProvider({ corsProxy });

	const FileProvider = resolveModule("FileProvider");

	const fp = new FileProvider(config.paths.root);
	await fp.validate();

	const libRules = getExecutingEnvironment() == "browser" ? [deleteAnyFolderRule] : [];
	const lib = new Library(rp);
	await lib.addFileProvider(fp, (fs) => FSLocalizationRules.bind(fs), libRules);

	if (config.paths.local) {
		const fp = new FileProvider(config.paths.local);
		await fp.validate();
		await lib.addFileProvider(fp);
	}

	const cacheFileProvider = new FileProvider(config.paths.cache);
	const cache = new IndexCacheProvider(cacheFileProvider);
	const hashes = new Hash();
	const tm = new ThemeManager();
	const encoder = new Encoder();
	const ticketManager = new TicketManager(lib, encoder, config.tokens.share);
	const parser = new MarkdownParser();
	const formatter = new MarkdownFormatter();
	const tablesManager = new TableDB(parser, lib);
	const errorArticlesProvider = new ErrorArticlePresenter();
	const parserContextFactory = new ParserContextFactory(
		config.paths.base,
		fp,
		tablesManager,
		parser,
		formatter,
		config.enterpriseServerUrl,
	);
	const logger: Logger = new BugsnagLogger(config.bugsnagApiKey);
	const searcher: Searcher = new LunrSearcher(lib, parser, parserContextFactory, cache);
	const sitePresenterFactory = new SitePresenterFactory(
		lib,
		parser,
		parserContextFactory,
		searcher,
		rp,
		errorArticlesProvider,
	);
	const contextFactory = new ContextFactory(tm, config.cookieSecret);

	return {
		am,
		tm,
		mp,
		rp,
		lib,
		vur,
		logger,
		parser,
		hashes,
		searcher,
		formatter,
		tablesManager,
		ticketManager,
		contextFactory,
		sitePresenterFactory,
		parserContextFactory,
		errorArticlesProvider,
		conf: {
			corsProxy: corsProxy,
			branch: config.branch,
			basePath: config.paths.base,
			isReadOnly: config.isReadOnly,
			isServerApp: config.isServerApp,
			ssoServerUrl: config.ssoServerUrl,
			ssoPublicKey: config.ssoPublicKey,
			isProduction: config.isProduction,
			enterpriseServerUrl: config.enterpriseServerUrl,
			bugsnagApiKey: config.bugsnagApiKey,
			gramaxVersion: config.gramaxVersion,
		},
	};
};

const container = window as {
	app?: Application;
};

const getApp = async (): Promise<Application> => {
	if (container.app) return container.app;
	const config = configure();
	container.app = await _init(config);
	return container.app;
};

export default getApp;
