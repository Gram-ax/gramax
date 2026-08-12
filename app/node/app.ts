import { initBackendModules } from "@app/resolveModule/backend";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import initAutoPull from "@core/AutoPull/AutoPull";
import { ContextFactory } from "@core/Context/ContextFactory";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructureEventHandlers from "@core/FileStructue/events/FileStuctureEventHandlers";
import { XxHash } from "@core/Hash/Hasher";
import HashItemProvider from "@core/Hash/HashItemProvider";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import AgentManager from "@ext/agent/core/agentManager";
import { AiDataProvider } from "@ext/ai/logic/AiDataProvider";
import EnterpriseManager from "@ext/enterprise/EnterpriseManager";
import { EnterpriseWorkspace } from "@ext/enterprise/EnterpriseWorkspace";
import MergeNotificationHandler from "@ext/enterprise/notifications/MergeNotificationHandler";
import { GesCloudManager } from "@ext/enterprise-cloud/GesCloudManager";
import RepositoryProviderEventHandlers from "@ext/git/core/Repository/events/RepositoryProviderEventHandlers";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { HealthcheckRegistry } from "@ext/healthcheck/HealthCheckRegistry";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import type Logger from "@ext/loggers/Logger";
import { LogLevel } from "@ext/loggers/Logger";
import { registerOtel } from "@ext/loggers/opentelemetry/registerOtel";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import ParserEventHandlers from "@ext/markdown/core/Parser/events/ParserEventHandlers";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type AuthManager from "@ext/security/logic/AuthManager";
import EnterpriseAuth from "@ext/security/logic/AuthProviders/EnterpriseAuth";
import ServerAuthManager from "@ext/security/logic/ServerAuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import { createNodeSearcherManager } from "@ext/serach/createSearcherManager";
import SettingsResolver from "@ext/settings/logic/SettingsResolver";
import { YamlSettingsStore } from "@ext/settings/logic/SettingsStore";
import { SourceDataProvider } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import { TableDB } from "@ext/tableDB/table";
import { PdfTemplateManager } from "@ext/wordExport/PdfTemplateManager";
import { WordTemplateManager } from "@ext/wordExport/WordTemplateManager";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import EnvAuth from "../../core/extensions/security/logic/AuthProviders/EnvAuth";
import FSTemplateEvents from "../../core/extensions/templates/logic/FSTemplateEvents";
import { type AppConfig, getConfig } from "../config/AppConfig";
import type Application from "../types/Application";

const init = async (config: AppConfig): Promise<Application> => {
	await registerOtel();
	await initBackendModules();
	if (!config.isReadOnly && !config.paths.data) throw new Error(`USER_DATA_PATH not specified`);

	const logger: Logger =
		config.isProduction && getExecutingEnvironment() !== "cli"
			? await BugsnagLogger.init(config)
			: new ConsoleLogger();
	logger.setLogLevel(LogLevel.trace);

	await XxHash.init();

	const healthcheckRegistry = new HealthcheckRegistry();
	const em = new EnterpriseManager(config.enterprise);

	const rp = new RepositoryProvider(config);

	const templateEventHandlers: FSTemplateEvents = new FSTemplateEvents();

	const parser = new MarkdownParser();
	new ParserEventHandlers(parser).mount();

	const formatter = new MarkdownFormatter();
	const tablesManager = new TableDB(parser);
	const parserContextFactory = new ParserContextFactory(config.paths.base, tablesManager, parser, formatter, rp);
	const resourceUpdaterFactory = new ResourceUpdaterFactory(parser, parserContextFactory, formatter);

	// TODO(app-settings): replace dummy yaml config with the real app-level
	// store (path under config.paths.data). Tracked in the epic.
	const fileConfig = YamlFileConfig.dummy();
	const appStore = new YamlSettingsStore(fileConfig as unknown as YamlFileConfig<Record<string, unknown>>);
	const settings = new SettingsResolver(config, appStore);

	const wm = new WorkspaceManager(
		(path) => MountFileProvider.fromDefault(new Path(path)),
		(fs) => {
			new FileStructureEventHandlers(fs, resourceUpdaterFactory).mount();
			new RepositoryProviderEventHandlers(fs, rp).mount();
			templateEventHandlers.mount(fs);
		},
		(workspace) => {
			if (workspace instanceof EnterpriseWorkspace) {
				return [new MergeNotificationHandler(workspace, parser, parserContextFactory)];
			}
			return [];
		},
		rp,
		config,
		fileConfig,
	);
	tablesManager.mountWorkspaceManager(wm); // TODO: remove
	parserContextFactory.mount(
		wm,
		async () => settings.resolveServices(wm.maybeCurrent())?.["diagram-renderer"]?.endpoint,
	); // TODO: remove

	const sdp = new SourceDataProvider(wm);
	rp.addSourceDataProvider(sdp);

	const adp = new AiDataProvider(wm);

	const enterpriseConfig = em.getConfig();
	const workspace = await wm.addWorkspace(config.paths.root?.value ?? "", {
		name: "Gramax",
		icon: "layers",
		enterprise: enterpriseConfig.gesUrl ? { ...enterpriseConfig, lastUpdateDate: 0 } : {},
	});
	await wm.setWorkspace(workspace);

	const ticketManager = new TicketManager(config.tokens.share);

	const hashes = new HashItemProvider();
	const customArticlePresenter = new CustomArticlePresenter();

	templateEventHandlers.withParser(parser, formatter, parserContextFactory);

	const ap = enterpriseConfig?.gesUrl
		? new EnterpriseAuth(config.paths.base, em, () => wm.current())
		: new EnvAuth(config.paths.base, config.admin.login, config.admin.password);
	const am: AuthManager = new ServerAuthManager(em, ap, ticketManager);
	const contextFactory = new ContextFactory(config.tokens.cookie, am);
	const sitePresenterFactory = new SitePresenterFactory(
		wm,
		parser,
		parserContextFactory,
		rp,
		customArticlePresenter,
		config.isReadOnly,
	);

	const workspaceConfig = await wm.maybeCurrent()?.config();
	const services = workspaceConfig?.services ?? config.services;

	const { aiAvailable, searcherManager } = await createNodeSearcherManager({
		config,
		wm,
		parser,
		parserContextFactory,
		tablesManager,
		healthcheckRegistry,
	});

	const wtm = new WordTemplateManager(wm);
	const ptm = new PdfTemplateManager(wm);

	const enterpriseCloudManager = new GesCloudManager(config.enterpriseCloud);
	const agentManager = new AgentManager(config);

	return {
		am,
		rp,
		wm,
		em,
		settings,
		hashes,
		logger,
		parser,
		tablesManager,
		adp,
		wtm,
		ptm,
		formatter,
		ticketManager,
		contextFactory,
		searcherManager,
		parserContextFactory,
		sitePresenterFactory,
		resourceUpdaterFactory,
		customArticlePresenter,
		enterpriseCloudManager,
		agentManager,
		healthcheckRegistry,
		conf: {
			search: config.search,
			basePath: config.paths.base,
			version: config.version,
			buildVersion: config.buildVersion,
			disableSeo: config.disableSeo,
			hideErrorCause: config.hideErrorCause,

			isRelease: config.isRelease,
			isReadOnly: config.isReadOnly,
			isProduction: config.isProduction,

			bugsnagApiKey: config.bugsnagApiKey,

			services,

			metrics: config.metrics,

			logo: config.logo,

			allowedOrigins: config.allowedGramaxUrls,

			portalAi: {
				enabled: aiAvailable,
			},

			forceUiLangSync: config.forceUiLangSync,
		},
	};
};

const getApp = (): Promise<Application> => {
	if (global.app) return global.app;
	global.app = init(getConfig());
	if (getExecutingEnvironment() !== "cli") void initAutoPull(global.app);
	return global.app;
};

export default getApp;
