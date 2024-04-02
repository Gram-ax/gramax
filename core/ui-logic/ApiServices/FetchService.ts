import resolveModule from "@app/resolveModule/frontend";
import FetchResponse from "./Types/FetchResponse";
import Method from "./Types/Method";
import MimeTypes from "./Types/MimeTypes";
import Url from "./Types/Url";
const ErrorConfirmService = import("../../extensions/errorHandlers/client/ErrorConfirmService");

const FetchService = {
	fetch: async <T = any>(
		url: Url,
		body?: BodyInit,
		mime = MimeTypes.text,
		method = Method.POST,
	): Promise<FetchResponse<T>> => {
		const res = await resolveModule("Fetcher")(url, body, mime, method);
		if (res.ok) return res;
		const error = await res?.json();
		(await ErrorConfirmService).default.notify(error);
		return res;
	},
};

export default FetchService;
