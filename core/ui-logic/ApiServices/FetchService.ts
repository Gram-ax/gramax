import resolveModule from "@app/resolveModule";
import ErrorConfirmService from "../../extensions/errorHandlers/client/ErrorConfirmService";
import FetchResponse from "./Types/FetchResponse";
import Method from "./Types/Method";
import MimeTypes from "./Types/MimeTypes";
import Url from "./Types/Url";

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
		ErrorConfirmService.notify(error);
		return res;
	},
};

export default FetchService;
