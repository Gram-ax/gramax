import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import Middleware from "@core/Api/middleware/Middleware";
import { buildContext, getQueryParam } from "@core/Api/middleware/utils";
import { getWorkspaceGesUrl } from "@ext/enterprise/utils/getWorkspaceEnterpriseConfig";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { PublishHealthcheckCode } from "@ext/git/core/GitPublish/PublishHealthcheck";
import t from "@ext/localization/locale/translate";
import { editCatalogContentPermission } from "@ext/security/logic/Permission/Permissions";
import checkPublishHealth from "../../git/core/GitPublish/logic/checkPublishHealth";

export default class PublishHealthcheckMiddleware extends Middleware {
	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		const catalogName = getQueryParam(req.query?.catalogName);
		if (!catalogName) return this._next.Process(req, res);

		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return this._next.Process(req, res);

		const ctx = await buildContext(this._app, req, res);
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
		if (
			ctx.user.type === "enterprise" &&
			!ctx.user.catalogPermission.enough(catalogName, editCatalogContentPermission)
		) {
			throw new DefaultError(t("git.publish.error.no-permission"));
		}

		return this._next.Process(req, res);
	}
}
