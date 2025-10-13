import ApiResponse from "@core/Api/ApiResponse";
import ApiRequest from "@core/Api/ApiRequest";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import { ApplyApiMiddleware } from "../../../logic/Api/ApplyMiddleware";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const gesUrl = this.app.em.getConfig().gesUrl;
		const ctx = await this.app.contextFactory.from({ req, res });

		if (gesUrl) {
			const sourceDatas = this.app.rp.getSourceDatas(ctx, this.app.wm.current().path());
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);
			if (enterpriseSource) await new EnterpriseApi(gesUrl).logout(enterpriseSource.token);
		}

		await this.app.am.logout(ctx.cookie, req, res);
	},
	[new MainMiddleware()],
);
