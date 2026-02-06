import { getExecutingEnvironment } from "@app/resolveModule/env";
import type Context from "@core/Context/Context";
import type PageDataContext from "@core/Context/PageDataContext";
import getClientPermissions from "@ext/enterprise/utils/getClientPermissions";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { getEnabledFeatures } from "@ext/toggleFeatures/features";
import type Application from "../../types/Application";

type GetPageDataContext = (args: {
	ctx: Context;
	app: Application;
	isArticle: boolean;
	userInfo?: UserInfo;
	isReadOnly?: boolean;
}) => Promise<PageDataContext>;

const getPageDataContext: GetPageDataContext = async ({ ctx, app, isArticle, userInfo, isReadOnly }) => {
	const conf = app.conf;
	const workspace = app.wm.maybeCurrent();
	const workspaceConfig = await workspace?.config();
	const isStatic = getExecutingEnvironment() === "static";
	const isBrowser = getExecutingEnvironment() === "browser";

	const enterpriseConfig = app.em.getConfig();
	const isGramaxAiEnabled = Boolean(
		conf.portalAi.enabled || app.adp.getEditorAiData(ctx, workspace?.path() ?? "").apiUrl,
	);

	let sourceDatas: SourceData[] = [];
	try {
		sourceDatas = app.rp.getSourceDatas(ctx, workspace?.path());
	} catch (error) {
		console.error(error);
	}
	const isEnterprise = !!enterpriseConfig.gesUrl;
	const isUnauthorized = isEnterprise && !getEnterpriseSourceData(sourceDatas, enterpriseConfig.gesUrl);

	const isGesUnauthorized = isEnterprise && isUnauthorized && isBrowser;
	if (isGesUnauthorized) isArticle = false;

	return {
		language: {
			content: ctx.contentLanguage || null,
			ui: ctx.ui || null,
		},
		theme: ctx.theme,
		pdfTemplates: (await app.ptm.from(workspace))?.getTemplates() ?? [],
		wordTemplates: (await app.wtm.from(workspace))?.getTemplates() ?? [],
		domain: ctx.domain,
		isLogged: !isStatic && ctx.user.isLogged,
		isArticle,
		isGesUnauthorized,
		workspace: {
			workspaces: app.wm.workspaces(),
			current: workspace?.path(),
			defaultPath: app.wm.defaultPath().value,
		},
		conf: {
			isReadOnly,
			version: conf.version,
			isRelease: conf.isRelease,
			basePath: conf.basePath.value,
			buildVersion: conf.buildVersion,
			isProduction: conf.isProduction,
			bugsnagApiKey: conf.bugsnagApiKey,
			metrics: conf.metrics,
			authServiceUrl: workspaceConfig?.services?.auth?.url || conf.services.auth.url,
			cloudServiceUrl: workspaceConfig?.services?.cloud?.url || conf.services.cloud.url,
			diagramsServiceUrl: workspaceConfig?.services?.diagramRenderer?.url || conf.services.diagramRenderer.url,
			enterprise: enterpriseConfig,
			logo: conf.logo,
			ai: { enabled: isGramaxAiEnabled },
			forceUiLangSync: conf.forceUiLangSync,
		},
		userInfo: userInfo || ctx.user.info || null,
		permissions: getClientPermissions(ctx.user),
		features: getExecutingEnvironment() === "next" ? getEnabledFeatures().map((f) => f.name) : null,
	};
};

export default getPageDataContext;
