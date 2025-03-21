import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";

export type SyncServiceEvents = Event<"start"> & Event<"finish", { mergeData: MergeData }> & Event<"error">;

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
		await SyncService._onFinish(data.mergeData, apiUrlCreator);
		await SyncService.events.emit("finish", { mergeData: data.mergeData });
	}

	private static async _sync(
		apiUrlCreator: ApiUrlCreator,
	): Promise<{ resOk: true; mergeData: MergeData } | { resOk: false }> {
		const res = await FetchService.fetch<MergeData>(apiUrlCreator.getStorageSyncUrl());
		if (!res.ok) return { resOk: false };
		return { resOk: true, mergeData: await res.json() };
	}

	private static async _onFinish(mergeData: MergeData, apiUrlCreator: ApiUrlCreator) {
		if (!mergeData.ok) {
			tryOpenMergeConflict({ mergeData: { ...mergeData } });
			return;
		}
		await ArticleUpdaterService.update(apiUrlCreator);
		void refreshPage();
	}
}
