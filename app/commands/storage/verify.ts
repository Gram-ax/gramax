import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import StorageСhecker from "@ext/storage/logic/StorageСhecker";
import StorageData from "@ext/storage/models/StorageData";
import { Command, ResponseKind } from "../../types/Command";

const verify: Command<{ data: StorageData }, boolean> = Command.create({
	path: "storage/verify",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ data }) {
		const sc = new StorageСhecker();
		return !!(await sc.getCorrectBranch(data, false));
	},

	params(ctx, q, body) {
		return {
			data: body,
		};
	},
});

export default verify;
