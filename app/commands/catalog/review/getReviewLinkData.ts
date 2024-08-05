import { ResponseKind } from "@app/types/ResponseKind";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { ReviewLinkData } from "@ext/catalog/actions/review/model/ReviewLinkData";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { Command } from "../../../types/Command";

const getReviewLinkData: Command<{ ticket: string }, ReviewLinkData> = Command.create({
	path: "catalog/review/getReviewLinkData",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ticket }) {
		const response = await fetch(`${this._app.wm.current().config().services?.review?.url}/repdata`, {
			body: ticket,
			method: "POST",
			headers: { "Content-Type": MimeTypes.text },
		});
		if (!response.ok) throw new DefaultError((await response.json()).message);
		return response.json();
	},

	params(_, __, body) {
		const ticket = body;
		return { ticket };
	},
});

export default getReviewLinkData;
