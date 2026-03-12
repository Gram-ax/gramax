import { readNDJson } from "@core/utils/readNDJson";
import FetchService from "@core-ui/ApiServices/FetchService";
import type Url from "@core-ui/ApiServices/Types/Url";
import type { SearchChatStreamItem as ResponseStreamItem } from "@ext/serach/types";

interface ChatStreamArgs {
	url: Url;
	query: string;
	signal: AbortSignal;
	onData: (data: string) => Promise<void>;
}

export const chatStream = async ({ url, query, signal, onData }: ChatStreamArgs) => {
	if (!query) return;
	const res = await FetchService.fetch<unknown>(url, undefined, undefined, undefined, undefined, undefined, signal);
	if (!res.ok || signal.aborted) return;

	const itemGenerator = readNDJson<ResponseStreamItem>(res.body.getReader(), signal);

	for await (const item of itemGenerator) {
		await onData(item.text);
	}
};
