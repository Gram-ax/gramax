import { ServicesConfig, type MetricsConfig } from "@app/config/AppConfig";
import { ContextFactory } from "@core/Context/ContextFactory";
import Path from "@core/FileProvider/Path/Path";
import Hash from "@core/Hash/HashItemProvider";
import type ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import { TableDB } from "@core/components/tableDB/table";
import VideoUrlRepository from "@core/components/video/videoUrlRepository";
import MailProvider from "@ext/MailProvider";
import ThemeManager from "@ext/Theme/ThemeManager";
import EnterpriseManager from "@ext/enterprise/EnterpriseManager";
import GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import HtmlParser from "@ext/html/HtmlParser";
import Logger from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import AuthManager from "@ext/security/logic/AuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import Searcher from "@ext/serach/Searcher";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";

interface Application {
	wm: WorkspaceManager;
	em: EnterpriseManager;
	hashes: Hash;
	logger: Logger;
	am: AuthManager;
	tm: ThemeManager;
	mp: MailProvider;
	searcher: Searcher;
	parser: MarkdownParser;
	htmlParser: HtmlParser;
	tablesManager: TableDB;
	vur: VideoUrlRepository;
	rp: GitRepositoryProvider;
	formatter: MarkdownFormatter;
	ticketManager: TicketManager;
	contextFactory: ContextFactory;
	parserContextFactory: ParserContextFactory;
	sitePresenterFactory: SitePresenterFactory;
	resourceUpdaterFactory: ResourceUpdaterFactory;
	customArticlePresenter: CustomArticlePresenter;
	conf: {
		basePath: Path;
		version: string;
		buildVersion: string;

		isRelease: boolean;
		isReadOnly: boolean;
		isProduction: boolean;
		disableSeo: boolean;

		bugsnagApiKey: string;

		services: ServicesConfig;

		metrics: MetricsConfig;

		logo: {
			imageUrl: string;
			linkUrl: string;
			linkTitle: string;
		};
	};
}

export default Application;
