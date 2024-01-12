import useSWR, { SWRResponse } from "swr";
import { BareFetcher, PublicConfiguration } from "swr/dist/types";
import FetchService from "./FetchService";
import Fetcher from "./Types/Fetcher";
import Method from "./Types/Method";
import MimeTypes from "./Types/MimeTypes";
import Url from "./Types/Url";

const fetchers: { [fetcher in Fetcher]: (url: Url) => Promise<any> } = {
	json: async (url: Url) => (await FetchService.fetch(url)).json(),
	text: async (url: Url) => (await FetchService.fetch(url)).text(),
};

export default abstract class UseSWRService {
	public static getData<Type = any>(
		url: Url,
		fetcher = Fetcher.json,
		isLoad = true,
		config?: Partial<PublicConfiguration<Type, Error, BareFetcher<Type>>>,
	): SWRResponse<Type, Error> {
		try {
			return useSWR<Type, Error>(
				isLoad ? url?.toString() : null,
				async () => await fetchers[fetcher](url),
				config,
			);
		} catch {
			return null;
		}
	}

	public static getDataByBody<Type = any>({
		url,
		body,
		mimeType = MimeTypes.json,
		method = Method.POST,
		isLoad = true,
	}: {
		url: Url;
		body: BodyInit;
		mimeType?: MimeTypes;
		method?: Method;
		isLoad?: boolean;
	}): SWRResponse<Type, Error> {
		try {
			return useSWR<Type, Error>(
				isLoad ? url?.toString() : null,
				async () => await FetchService.fetch(url, body, mimeType, method).then((r) => r.json()),
			);
		} catch (error) {
			return null;
		}
	}
}
