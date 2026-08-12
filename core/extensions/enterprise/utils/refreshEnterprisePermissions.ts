import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import ClientAuthManager from "@ext/security/logic/ClientAuthManager";

const refreshEnterprisePermissions = async (
	app: Application,
	ctx: Context,
	gesUrl?: string,
): Promise<boolean | undefined> => {
	const isEnterprise = gesUrl && app.am instanceof ClientAuthManager && ctx.user instanceof EnterpriseUser;
	if (!isEnterprise) return;

	const am = app.am as ClientAuthManager;
	const permissionUpdateDate = ctx.user.getEnterpriseInfo()?.updateDate?.getTime();
	await am.forceUpdateEnterpriseUser(ctx.cookie, ctx.user);

	return permissionUpdateDate !== ctx.user.getEnterpriseInfo()?.updateDate?.getTime();
};

export default refreshEnterprisePermissions;
