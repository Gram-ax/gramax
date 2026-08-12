import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import t from "@ext/localization/locale/translate";

type PublishServiceEvents = Event<"start"> &
	Event<"finish"> &
	Event<"error", { error: DefaultError; apiUrlCreator: ApiUrlCreator }>;

const PUBLISH_ATTEMPTS_COUNT = 2;

const syncCatalog = (apiUrlCreator: ApiUrlCreator) =>
	new Promise<boolean>((resolve) => {
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

const getPublishError = async (response: Response): Promise<DefaultError> => {
	const responseWithError = response as Response & { error?: DefaultError; body?: DefaultError };
	const error = responseWithError.error ?? responseWithError.body;
	if (error) return error;

	try {
		return await response.json();
	} catch (e) {
		return new DefaultError(`${t("git.publish.error.unknown")} ${e instanceof Error ? e.message : String(e)}`);
	}
};

export const PublishEmitter = {
	async publish(apiUrlCreator: ApiUrlCreator, message: string, files: string[]): Promise<boolean> {
		await PublishEmitter.events.emit("start", {});

		if (!(await syncCatalog(apiUrlCreator))) return false;

		const endpoint = apiUrlCreator.getStoragePublishUrl(message);
		for (let attempt = 0; attempt < PUBLISH_ATTEMPTS_COUNT; attempt++) {
			const isLastAttempt = attempt === PUBLISH_ATTEMPTS_COUNT - 1;
			const res = await FetchService.fetch<DefaultError>(
				endpoint,
				JSON.stringify(files),
				MimeTypes.json,
				undefined,
				isLastAttempt,
			);
			if (res.ok) {
				await PublishEmitter.events.emit("finish", {});
				return true;
			}

			const error = await getPublishError(res);
			if (attempt === 0 && error.props?.errorCode === GitErrorCode.PushRejectedError) {
				if (!(await syncCatalog(apiUrlCreator))) return false;
				continue;
			}
			if (!isLastAttempt) ErrorConfirmService.notify(error);
			await PublishEmitter.events.emit("error", { error, apiUrlCreator });
			return false;
		}

		return false;
	},

	events: createEventEmitter<PublishServiceEvents>(),
};
