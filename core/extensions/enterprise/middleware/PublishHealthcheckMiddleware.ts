import { getExecutingEnvironment } from "@app/resolveModule/env";
import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import Middleware from "@core/Api/middleware/Middleware";
import type Query from "@core/Api/Query";
import type Context from "@core/Context/Context";
import { getWorkspaceGesUrl } from "@ext/enterprise/utils/getWorkspaceEnterpriseConfig";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { PublishHealthcheckCode } from "@ext/git/core/GitPublish/PublishHealthcheck";
import t from "@ext/localization/locale/translate";
import checkPublishHealth from "../../git/core/GitPublish/logic/checkPublishHealth";

export default class PublishHealthcheckMiddleware extends Middleware {
	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		const catalogName = this._getCatalogName(req);
		if (!catalogName) return this._next.Process(req, res);

		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return this._next.Process(req, res);

		const ctx = await this._buildContext(req, res);
		const workspaceConfig = await workspace.config();
		const healthcheck = await checkPublishHealth(this._app, ctx, catalog, getWorkspaceGesUrl(workspaceConfig));

		if (healthcheck.code === PublishHealthcheckCode.PermissionsUnavailable) {
			throw new DefaultError(t("git.publish.error.permissions-unavailable"));
		}
		if (healthcheck.code === PublishHealthcheckCode.ProtectedBranch) {
			throw new DefaultError(
				t("git.publish.error.protected-branch-description"),
				undefined,
				{},
				true,
				t("git.publish.error.protected-branch"),
			);
		}

		return this._next.Process(req, res);
	}

	private _getCatalogName(req: ApiRequest): string | undefined {
		const catalogName = req.query?.catalogName;
		if (Array.isArray(catalogName)) return catalogName[0];
		return catalogName;
	}

	private async _buildContext(req: ApiRequest, res: ApiResponse): Promise<Context> {
		const query = req.query;
		const env = getExecutingEnvironment();

		if (env === "browser" || env === "tauri") {
			const queryLanguage = Array.isArray(query?.l) ? query?.l[0] : query?.l;
			const language = typeof queryLanguage === "string" ? queryLanguage : "en";
			return this._app.contextFactory.fromBrowser({ language, query: query as Query });
		}

		return this._app.contextFactory.fromNode({ req, res, query: query as Query });
	}
}
