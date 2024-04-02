import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import { ApiRedirectMiddleware } from "@core/Api/middleware/ApiRedirectMiddleware";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import getTokenHtml from "@ext/security/logic/public/getTokenHtml";
import { ApplyApiMiddleware } from "../../../logic/Api/ApplyMiddleware";

const apiApplyApiMiddleware = "api/auth/sendMailToken";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const mail = req.query.mail as string;
		const ticket = encodeURIComponent(this.app.am.getMailLoginTicket(mail));
		const url = apiUtils.getDomainByBasePath(req, this.app.conf.basePath.value) + "?t=" + ticket;
		await this.app.mp.sendMail(mail, "DocReader подтверждение почты", "", getTokenHtml(url));
		res.end();
	},
	[new MainMiddleware(), new ApiRedirectMiddleware(apiApplyApiMiddleware)],
);
