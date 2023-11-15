import { ContextFactory } from "@core/Context/ContextFactory";
import Path from "@core/FileProvider/Path/Path";
import Hash from "@core/Hash/Hash";
import Library from "@core/Library/Library";
import ErrorArticlePresenter from "@core/SitePresenter/ErrorArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import { TableDB } from "@core/components/tableDB/table";
import VideoUrlRepository from "@core/components/video/videoUrlRepository";
import MailProvider from "@ext/MailProvider";
import ThemeManager from "@ext/Theme/ThemeManager";
import VersionControlProvider from "@ext/VersionControl/model/VersionControlProvider";
import Logger from "@ext/loggers/Logger";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import Searcher from "@ext/search/Searcher";
import AuthManager from "@ext/security/logic/AuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import StorageProvider from "@ext/storage/logic/StorageProvider";

interface Application {
	lib: Library;
	hashes: Hash;
	logger: Logger;
	am: AuthManager;
	tm: ThemeManager;
	mp: MailProvider;
	searcher: Searcher;
	sp: StorageProvider;
	parser: MarkdownParser;
	tablesManager: TableDB;
	vur: VideoUrlRepository;
	vcp: VersionControlProvider;
	formatter: MarkdownFormatter;
	ticketManager: TicketManager;
	contextFactory: ContextFactory;
	parserContextFactory: ParserContextFactory;
	sitePresenterFactory: SitePresenterFactory;
	errorArticlesProvider: ErrorArticlePresenter;
	conf: {
		basePath: Path;
		isReadOnly: boolean;
		isServerApp: boolean;
		isProduction: boolean;
		enterpriseServerUrl: string;
		corsProxy: string;
		bugsnagApiKey: string;
		gramaxVersion: string;
	};
}

export default Application;
