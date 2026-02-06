import resolveModule from "@app/resolveModule/frontend";
import type { Event } from "@core/Event/EventEmitter";
import trimRoutePrefix from "@core-ui/ApiServices/trimRoutePrefix";
import { events } from "@core-ui/hooks/useApi";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import type FetchResponse from "./Types/FetchResponse";
import Method from "./Types/Method";
import MimeTypes from "./Types/MimeTypes";
import type Url from "./Types/Url";

export type OnDidCommandEv = { command: string; args: object; result: unknown };

export type FetchServiceEvents = Event<"on-did-command", OnDidCommandEv>;

const ErrorConfirmService = import("../../extensions/errorHandlers/client/ErrorConfirmService");

/**
 * @deprecated Consider using `useApi(..)` hook instead
 */
export default class FetchService {
	static async fetch<T = any>(
		url: Url,
		body?: BodyInit,
		mime = MimeTypes.text,
		method = Method.POST,
		notifyError = true,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_onDidCommand?: (command: string, args: object, result: unknown) => void,
		signal?: AbortSignal,
	): Promise<FetchResponse<T>> {
		const command = trimRoutePrefix(url);

		const res = await resolveModule("Fetcher")(
			url,
			body,
			mime,
			method,
			false,
			(command, args, result) => {
				void events.emit("on-did-command", { command, args, result });
			},
			signal,
		);

		if (res.ok) return res;

		let error: any;
		if (res.status === 404) {
			error = new DefaultError(`${t("command")} "${command}" ${t("not-found2").toLowerCase()}`);
		} else {
			try {
				error = await res.json();
			} catch (e) {
				error = new DefaultError(
					t("app.error.command-failed.body"),
					null,
					{ html: true },
					false,
					t("app.error.command-failed.title"),
				);
				console.error(new Error(`${command} \n${e.message}`));
			}
		}
		if (notifyError) (await ErrorConfirmService).default.notify(error);
		return res;
	}
}
