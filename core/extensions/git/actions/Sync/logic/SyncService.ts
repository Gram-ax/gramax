import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import ClientSyncResult from "@ext/git/core/model/ClientSyncResult";

export type SyncServiceEvents = Event<"start"> & Event<"finish", { syncData: ClientSyncResult }> & Event<"error">;

export default class SyncService {
	private static _events = createEventEmitter<SyncServiceEvents>();

	static get events() {
		return SyncService._events;
	}

	public static async sync(apiUrlCreator: ApiUrlCreator) {
		await SyncService.events.emit("start", {});
		const data = await SyncService._sync(apiUrlCreator);
		if (!data.resOk) {
			await SyncService.events.emit("error", {});
			return;
		}
		await SyncService._onFinish(data.syncData, apiUrlCreator);
		await SyncService.events.emit("finish", { syncData: data.syncData });
	}

	private static async _sync(
		apiUrlCreator: ApiUrlCreator,
	): Promise<{ resOk: true; syncData: ClientSyncResult } | { resOk: false }> {
		const res = await FetchService.fetch<ClientSyncResult>(apiUrlCreator.getStorageSyncUrl());
		if (!res.ok) return { resOk: false };
		return { resOk: true, syncData: await res.json() };
	}

	private static async _onFinish(syncData: ClientSyncResult, apiUrlCreator: ApiUrlCreator) {
		if (!syncData.mergeData.ok) {
			tryOpenMergeConflict({ mergeData: { ...syncData.mergeData } });
			return;
		}
		await ArticleUpdaterService.update(apiUrlCreator);
		void refreshPage();
	}
}
