import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import type ServerContext from "../../types/ServerContext";

const logout = async (serverContext: ServerContext) => {
	const { path, req, res, app, commands } = serverContext;
	if (path.pathname !== "/api/auth/logout") return;

	const gesUrl = app.em.getConfig().gesUrl;
	const ctx = await app.contextFactory.fromNode({ req, res });

	if (gesUrl) {
		const sourceDatas = app.rp.getSourceDatas(ctx, app.wm.current().path());
		const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);
		if (enterpriseSource) await new EnterpriseApi(gesUrl).logout(enterpriseSource.token);
		await commands.storage.removeSourceData.do({
			ctx,
			sourceName: getStorageNameByData(enterpriseSource),
		});
	}

	await app.am.logout(ctx.cookie, req, res);
};

export default logout;
