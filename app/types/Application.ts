import type { MetricsConfig, ServicesConfig } from "@app/config/AppConfig";
import type { ContextFactory } from "@core/Context/ContextFactory";
import type Path from "@core/FileProvider/Path/Path";
import type Hash from "@core/Hash/HashItemProvider";
import type ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import type CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import type SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import type { AiDataProvider } from "@ext/ai/logic/AiDataProvider";
import type EnterpriseManager from "@ext/enterprise/EnterpriseManager";
import type { GesCloudManager } from "@ext/enterprise-cloud/GesCloudManager";
import type GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type Logger from "@ext/loggers/Logger";
import type MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type AuthManager from "@ext/security/logic/AuthManager";
import type { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import type SearcherManager from "@ext/serach/SearcherManager";
import type ThemeManager from "@ext/Theme/ThemeManager";
import type { TableDB } from "@ext/tableDB/table";
import type { PdfTemplateManager } from "@ext/wordExport/PdfTemplateManager";
import type { WordTemplateManager } from "@ext/wordExport/WordTemplateManager";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";

interface Application {
	wm: WorkspaceManager;
	em: EnterpriseManager;
	hashes: Hash;
	logger: Logger;
	am: AuthManager;
	tm: ThemeManager;
	parser: MarkdownParser;
	tablesManager: TableDB;
	rp: GitRepositoryProvider;
	adp: AiDataProvider;
	wtm: WordTemplateManager;
	ptm: PdfTemplateManager;
	formatter: MarkdownFormatter;
	ticketManager: TicketManager;
	contextFactory: ContextFactory;
	searcherManager: SearcherManager;
	parserContextFactory: ParserContextFactory;
	sitePresenterFactory: SitePresenterFactory;
	resourceUpdaterFactory: ResourceUpdaterFactory;
	customArticlePresenter: CustomArticlePresenter;
	enterpriseCloudManager: GesCloudManager;
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

		allowedOrigins?: string[];

		portalAi: { enabled: boolean };

		forceUiLangSync: boolean;
	};
}

export default Application;
