import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import { ApplyApiMiddleware } from "../../../logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const cookie = (await this.app.contextFactory.from(req, res)).cookie;
		await this.app.am.assert(req, res, cookie);
	},
	[new MainMiddleware()],
);
