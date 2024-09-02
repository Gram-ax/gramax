import resolveModule from "@app/resolveModule/frontend";
import trimRoutePrefix from "@core-ui/ApiServices/trimRoutePrefix";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
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

		let error: any;
		if (res.status === 404) {
			error = new DefaultError(
				`${t("command")} "${trimRoutePrefix(url)}" ${t("not-found2").toLowerCase()}`,
				error,
			);
		} else {
			try {
				error = await res.json();
			} catch (e) {
				console.log(`Command ${trimRoutePrefix(url)} does not have correct error!`);
			}
		}

		(await ErrorConfirmService).default.notify(error);
		return res;
	},
};

export default FetchService;
