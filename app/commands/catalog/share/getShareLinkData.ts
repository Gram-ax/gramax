import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ShareLinkHandler from "@ext/catalog/actions/share/logic/ShareLinkHandler";
import ShareLinkData from "@ext/catalog/actions/share/model/ShareLinkData";
import { Command, ResponseKind } from "../../../types/Command";

const getShareLinkData: Command<{ ticket: string }, ShareLinkData> = Command.create({
	path: "catalog/share/getShareLinkData",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	do({ ticket }) {
		const shareLinkCreator = new ShareLinkHandler();
		return shareLinkCreator.getShareLink(ticket);
	},

	params(_, __, body) {
		return { ticket: body };
	},
});

export default getShareLinkData;
