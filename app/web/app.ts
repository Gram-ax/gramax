import resolveBackendModule, { initBackendModules } from "@app/resolveModule/backend";
import { ContextFactory } from "@core/Context/ContextFactory";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
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
import { ClientGesCloudAuthManager } from "@ext/enterprise-cloud/logic/ClientGesCloudAuthManager";
import RepositoryProviderEventHandlers from "@ext/git/core/Repository/events/RepositoryProviderEventHandlers";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import BugsnagLogger from "@ext/loggers/BugsnagLogger";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import type Logger from "@ext/loggers/Logger";
import { isLoggingEnabled } from "@ext/loggers/opentelemetry/logLevel";
import { registerOtel } from "@ext/loggers/opentelemetry/registerOtel";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import ParserEventHandlers from "@ext/markdown/core/Parser/events/ParserEventHandlers";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type AuthManager from "@ext/security/logic/AuthManager";
import ClientAuthManager from "@ext/security/logic/ClientAuthManager";
import { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import { createWebSearcherManager } from "@ext/serach/createSearcherManager";
import SettingsResolver from "@ext/settings/logic/SettingsResolver";
import { YamlSettingsStore } from "@ext/settings/logic/SettingsStore";
import { migrateAppConfig } from "@ext/settings/migration/appMigration";
import { SourceDataProvider } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import { TableDB } from "@ext/tableDB/table";
import FSTemplateEvents from "@ext/templates/logic/FSTemplateEvents";
import { PdfTemplateManager } from "@ext/wordExport/PdfTemplateManager";
import { WordTemplateManager } from "@ext/wordExport/WordTemplateManager";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import setWorkerProxy from "../../apps/web/src/logic/setWorkerProxy";
import { type AppConfig, type AppGlobalConfig, getConfig } from "../config/AppConfig";
import type Application from "../types/Application";

const init = async (config: AppConfig): Promise<Application> => {
	if (isLoggingEnabled()) await registerOtel();

	await initBackendModules();

	const initWasm = resolveBackendModule("initWasm");

	await initWasm?.(config.services.gitProxy.url);
	await XxHash.init();

	const fileConfig = await YamlFileConfig.readFromFile<AppGlobalConfig>(
		new DiskFileProvider(config.paths.data),
		new Path("config.yaml"),
	);

	await migrateAppConfig(fileConfig);
	const appStore = new YamlSettingsStore(fileConfig);
	const settings = new SettingsResolver(config, appStore);

	const rp = new RepositoryProvider(config);
	const em = new EnterpriseManager(config.enterprise, fileConfig);
	const templateEventHandlers = new FSTemplateEvents();

	const parser = new MarkdownParser();
	new ParserEventHandlers(parser).mount();

	const formatter = new MarkdownFormatter();
	const tablesManager = new TableDB(parser);
	const parserContextFactory = new ParserContextFactory(config.paths.base, tablesManager, parser, formatter, rp);
	const resourceUpdaterFactory = new ResourceUpdaterFactory(parser, parserContextFactory, formatter);

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

	await wm.readWorkspaces();
	const workspaceConfig = await wm.maybeCurrent()?.config();
	const services = workspaceConfig?.services ?? config.services;
	setWorkerProxy(services.gitProxy.url);

	const hashes = new HashItemProvider();
	const ticketManager = new TicketManager(config.tokens.share);
	const customArticlePresenter = new CustomArticlePresenter();
	const logger: Logger = config.isProduction ? await BugsnagLogger.init(config) : new ConsoleLogger();
	const sitePresenterFactory = new SitePresenterFactory(
		wm,
		parser,
		parserContextFactory,
		rp,
		customArticlePresenter,
		config.isReadOnly,
	);

	const enterpriseCloudManager = new GesCloudManager(config.enterpriseCloud, fileConfig);

	const am: AuthManager =
		enterpriseCloudManager.getConfig().url && enterpriseCloudManager.getConfig().enabled
			? new ClientGesCloudAuthManager(enterpriseCloudManager)
			: new ClientAuthManager(em);
	const contextFactory = new ContextFactory(config.tokens.cookie, am);

	const searcherManager = await createWebSearcherManager({
		parser,
		parserContextFactory,
		wm,
		config,
		tablesManager,
	});
	const wtm = new WordTemplateManager(wm);
	const ptm = new PdfTemplateManager(wm);
	const agentManager = new AgentManager(config);

	templateEventHandlers.withParser(parser, formatter, parserContextFactory);

	return {
		am,
		wm,
		em,
		rp,
		settings,
		adp,
		wtm,
		ptm,
		logger,
		parser,
		hashes,
		formatter,
		tablesManager,
		ticketManager,
		contextFactory,
		searcherManager,
		sitePresenterFactory,
		parserContextFactory,
		resourceUpdaterFactory,
		customArticlePresenter,
		enterpriseCloudManager,
		agentManager,
		conf: {
			services,
			logo: config.logo,
			search: config.search,

			basePath: config.paths.base,
			disableSeo: config.disableSeo,
			hideErrorCause: config.hideErrorCause,

			isRelease: config.isRelease,
			isReadOnly: config.isReadOnly,
			isProduction: config.isProduction,

			metrics: config.metrics,
			version: config.version,
			buildVersion: config.buildVersion,
			bugsnagApiKey: config.bugsnagApiKey,

			portalAi: {
				enabled: false,
			},

			forceUiLangSync: config.forceUiLangSync,
		},
	};
};

const container = window as unknown as {
	app?: Promise<Application>;
};

const getApp = (): Promise<Application> => {
	if (container.app != null) return container.app;
	const config = getConfig();
	container.app = init(config);
	return container.app;
};

export default getApp;
