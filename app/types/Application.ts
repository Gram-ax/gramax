import { ContextFactory } from "@core/Context/ContextFactory";
import Path from "@core/FileProvider/Path/Path";
import Hash from "@core/Hash/Hash";
import Library from "@core/Library/Library";
import PluginProvider from "@core/Plugin/logic/PluginProvider";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import { TableDB } from "@core/components/tableDB/table";
import VideoUrlRepository from "@core/components/video/videoUrlRepository";
import Cache from "@ext/Cache";
import MailProvider from "@ext/MailProvider";
import ThemeManager from "@ext/Theme/ThemeManager";
import GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import HtmlParser from "@ext/html/HtmlParser";
import Logger from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import AuthManager from "@ext/security/logic/AuthManager";
import Sso from "@ext/security/logic/AuthProviders/Sso";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import type { BrowserFileProvider } from "apps/browser/src/logic/FileProvider/BrowserFileProvider";

interface Application {
	sso: Sso;
	lib: Library;
	cache: Cache;
	hashes: Hash;
	logger: Logger;
	am: AuthManager;
	tm: ThemeManager;
	mp: MailProvider;
	parser: MarkdownParser;
	htmlParser: HtmlParser;
	tablesManager: TableDB;
	vur: VideoUrlRepository;
	rp: GitRepositoryProvider;
	formatter: MarkdownFormatter;
	ticketManager: TicketManager;
	contextFactory: ContextFactory;
	pluginProvider: PluginProvider;
	parserContextFactory: ParserContextFactory;
	sitePresenterFactory: SitePresenterFactory;
	customArticlePresenter: CustomArticlePresenter;
	obsoleteFp: BrowserFileProvider;
	conf: {
		basePath: Path;

		version: string;
		isRelease: boolean;
		isReadOnly: boolean;
		isServerApp: boolean;
		isProduction: boolean;

		bugsnagApiKey: string;

		services: {
			review: { url: string };
			cors: { url: string };
			auth: { url: string };
			diagramRenderer: { url: string };
			sso: { publicKey: string; url: string };
		};
	};
}

export default Application;
