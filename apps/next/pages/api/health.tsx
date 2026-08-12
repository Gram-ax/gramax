import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import { ApplyApiMiddleware } from "../../logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function handler(_: ApiRequest, res: ApiResponse) {
		const { healthcheckRegistry } = this.app;
		if (!healthcheckRegistry) {
			res.statusCode = 200;
			res.send({ status: "healthy", checks: {} });
			return;
		}

		const result = await healthcheckRegistry.checkAll();
		res.statusCode = result.status === "healthy" ? 200 : 503;
		res.send(result);
	},
	[new MainMiddleware()],
);
