import { initEnterpriseDocportalSource } from "@ext/enterprise/utils/initEnterpriseDocportalSource";
import type User from "@ext/security/logic/User/User";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type ServerContext from "../../types/ServerContext";

const assert = async (serverContext: ServerContext) => {
	const { path, req, res, app, commands } = serverContext;
	if (path.pathname !== "/api/auth/assert") return;

	const ctx = await app.contextFactory.fromNode({ req, res });
	await app.am.assert(req, res, ctx.cookie, async (user: User) => {
		await initEnterpriseDocportalSource(user, app.em.getConfig(), (data: SourceData) => {
			commands.storage.sourceData.setSourceData.do({ ctx, ...data });
		});
	});
};

export default assert;
