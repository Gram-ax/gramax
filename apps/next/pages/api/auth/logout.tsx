import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { ApplyApiMiddleware } from "../../../logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const gesUrl = this.app.em.getConfig().gesUrl;
		const ctx = await this.app.contextFactory.fromNode({ req, res });

		if (gesUrl) {
			const sourceDatas = this.app.rp.getSourceDatas(ctx, this.app.wm.current().path());
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);
			if (enterpriseSource) await new EnterpriseApi(gesUrl).logout(enterpriseSource.token);
			await this.commands.storage.removeSourceData.do({
				ctx,
				sourceName: getStorageNameByData(enterpriseSource),
			});
		}

		await this.app.am.logout(ctx.cookie, req, res);
	},
	[new MainMiddleware()],
);
