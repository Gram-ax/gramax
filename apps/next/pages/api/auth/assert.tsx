import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import { initEnterpriseDocportalSource } from "@ext/enterprise/utils/initEnterpriseDocportalSource";
import User from "@ext/security/logic/User/User";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { ApplyApiMiddleware } from "../../../logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const ctx = await this.app.contextFactory.from(req, res);
		await this.app.am.assert(req, res, ctx.cookie, async (user: User) => {
			await initEnterpriseDocportalSource(user, (data: SourceData) => {
				this.commands.storage.setSourceData.do({ ctx, ...data });
			});
		});
	},
	[new MainMiddleware()],
);
