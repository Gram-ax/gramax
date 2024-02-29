import ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";

let _onStartSync: () => void | Promise<void>;
let _onFinishSync: () => void | Promise<void>;
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

	public static async sync(apiUrlCreator: ApiUrlCreator, isReview: boolean) {
		await _onStartSync?.();
		const isOk = await SyncService._sync(apiUrlCreator, isReview);
		if (!isOk) {
			await _onSyncError?.();
			return;
		}
		await _onFinishSync?.();
	}

	private static async _sync(apiUrlCreator: ApiUrlCreator, isReview: boolean): Promise<boolean> {
		const res = await FetchService.fetch<null>(apiUrlCreator.getStorageSyncUrl(!isReview));
		return res.ok;
	}
}
