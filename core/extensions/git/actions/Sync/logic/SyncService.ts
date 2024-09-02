import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";

let _onStartSync: () => void | Promise<void>;
let _onFinishSync: (mergeData: MergeData) => void | Promise<void>;
let _onSyncError: () => void | Promise<void>;

export default class SyncService {
	public static bindOnSyncService({
		onStartSync,
		onFinishSync,
		onSyncError,
	}: {
		onStartSync?: typeof _onStartSync;
		onFinishSync?: typeof _onFinishSync;
		onSyncError?: typeof _onSyncError;
	}) {
		_onStartSync = onStartSync;
		_onFinishSync = onFinishSync;
		_onSyncError = onSyncError;
	}

	public static async sync(apiUrlCreator: ApiUrlCreator) {
		await _onStartSync?.();
		const { ok, mergeData } = await SyncService._sync(apiUrlCreator);
		if (!ok) {
			await _onSyncError?.();
			return;
		}
		await _onFinishSync?.(mergeData);
	}

	private static async _sync(apiUrlCreator: ApiUrlCreator): Promise<{ ok: boolean; mergeData: MergeData }> {
		const res = await FetchService.fetch<MergeData>(apiUrlCreator.getStorageSyncUrl());
		return { ok: res.ok, mergeData: await res.json() };
	}
}
