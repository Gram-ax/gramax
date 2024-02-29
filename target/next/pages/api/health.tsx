import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import { ApplyApiMiddleware } from "../../logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	function (req: ApiRequest, res: ApiResponse) {
		res.send(null);
	},
	[new MainMiddleware()],
);
