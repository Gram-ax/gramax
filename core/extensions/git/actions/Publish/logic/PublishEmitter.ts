import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import t from "@ext/localization/locale/translate";

type PublishServiceEvents = Event<"start"> &
	Event<"finish"> &
	Event<"error", { error: DefaultError; apiUrlCreator: ApiUrlCreator }>;

export const PublishEmitter = {
	async publish(apiUrlCreator: ApiUrlCreator, message: string, files: string[]): Promise<boolean> {
		await PublishEmitter.events.emit("start", {});

		const syncOk = await new Promise<boolean>((resolve) => {
			const cleanup = () => {
				SyncService.events.off(finishToken);
				SyncService.events.off(errorToken);
				SyncService.events.off(conflictResolvedToken);
				SyncService.events.off(conflictAbortedToken);
			};
			const finishToken = SyncService.events.on("finish", ({ syncData }) => {
				cleanup();
				resolve(syncData.mergeData.ok);
			});
			const errorToken = SyncService.events.on("error", () => {
				cleanup();
				resolve(false);
			});
			const conflictResolvedToken = SyncService.events.on("conflict-resolved", () => {
				cleanup();
				resolve(true);
			});
			const conflictAbortedToken = SyncService.events.on("conflict-aborted", () => {
				cleanup();
				resolve(false);
			});
			SyncService.sync(apiUrlCreator);
		});

		if (!syncOk) return false;

		const endpoint = apiUrlCreator.getStoragePublishUrl(message);
		const res = await FetchService.fetch<DefaultError>(endpoint, JSON.stringify(files), MimeTypes.json);

		if (!res.ok) {
			const resWithError = res as unknown as Response & { error?: DefaultError; body?: DefaultError };
			const errorFromFetch = resWithError.error ?? resWithError.body;
			if (errorFromFetch) {
				await PublishEmitter.events.emit("error", { error: errorFromFetch, apiUrlCreator });
				return false;
			}

			try {
				const error = await res.json();
				await PublishEmitter.events.emit("error", { error, apiUrlCreator });
				return false;
			} catch (e) {
				const error = new DefaultError(
					`${t("git.publish.error.unknown")} ${e instanceof Error ? e.message : String(e)}`,
				);
				await PublishEmitter.events.emit("error", { error, apiUrlCreator });
				return false;
			}
		}

		await PublishEmitter.events.emit("finish", {});
		return true;
	},

	events: createEventEmitter<PublishServiceEvents>(),
};
