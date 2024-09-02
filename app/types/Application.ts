import { ContextFactory } from "@core/Context/ContextFactory";
import Path from "@core/FileProvider/Path/Path";
import Hash from "@core/Hash/Hash";
import PluginProvider from "@core/Plugin/logic/PluginProvider";
import type ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
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
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";

interface Application {
	wm: WorkspaceManager;
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
	pluginProvider: PluginProvider;
	contextFactory: ContextFactory;
	parserContextFactory: ParserContextFactory;
	sitePresenterFactory: SitePresenterFactory;
	resourceUpdaterFactory: ResourceUpdaterFactory;
	customArticlePresenter: CustomArticlePresenter;
	conf: {
		basePath: Path;

		version: string;
		buildVersion: string;
		glsUrl: string;
		isRelease: boolean;
		isReadOnly: boolean;
		isServerApp: boolean;
		isProduction: boolean;

		bugsnagApiKey: string;
		yandexMetricCounter: string;
	};
}

export default Application;
