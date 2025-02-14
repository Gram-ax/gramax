import resolveModule from "@app/resolveModule/frontend";
import trimRoutePrefix from "@core-ui/ApiServices/trimRoutePrefix";
import { EventEmitter, type Event, type EventListener } from "@core/Event/EventEmitter";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import FetchResponse from "./Types/FetchResponse";
import Method from "./Types/Method";
import MimeTypes from "./Types/MimeTypes";
import Url from "./Types/Url";

export type OnDidCommandEv = { command: string; args: object; result: unknown };

export type FetchServiceEvents = Event<"on-did-command", OnDidCommandEv>;

const ErrorConfirmService = import("../../extensions/errorHandlers/client/ErrorConfirmService");

export default class FetchService {
	private static _events = new EventEmitter<FetchServiceEvents>();

	static async fetch<T = any>(
		url: Url,
		body?: BodyInit,
		mime = MimeTypes.text,
		method = Method.POST,
		notifyError = true,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_onDidCommand?: (command: string, args: object, result: unknown) => void,
	): Promise<FetchResponse<T>> {
		const command = trimRoutePrefix(url);

		const res = await resolveModule("Fetcher")(url, body, mime, method, false, (command, args, result) => {
			void FetchService._events.emit("on-did-command", { command, args, result });
		});

		if (res.ok) return res;

		let error: any;
		if (res.status === 404) {
			error = new DefaultError(`${t("command")} "${command}" ${t("not-found2").toLowerCase()}`, error);
		} else {
			try {
				error = await res.json();
			} catch (e) {
				console.log(`Command ${command} does not have correct error!`);
			}
		}
		if (notifyError) (await ErrorConfirmService).default.notify(error);
		return res;
	}

	static get events(): EventListener<FetchServiceEvents> {
		return this._events;
	}
}
