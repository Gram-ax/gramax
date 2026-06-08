import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useSyncCount } from "@core-ui/ContextServices/SyncCount/useSyncCount";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import SyncLayout from "@ext/git/actions/Sync/components/SyncLayout";
import { useAvailableSync } from "@ext/git/actions/Sync/logic/hooks/useAvailableSync";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import useSourceData from "@ext/storage/components/useSourceData";
import { useOpenRestoreSourceTokenModal } from "@ext/storage/logic/SourceDataProvider/components/useOpenRestoreSourceTokenModal";
import { type CSSProperties, useCallback, useEffect } from "react";

const Sync = ({ style, disable }: { style?: CSSProperties; disable?: boolean }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const syncProcess = SyncIconService.value;

	const { syncCount, updateSyncCount } = useSyncCount(catalogName);

	const source = useSourceData();
	const openRestoreSourceModal = useOpenRestoreSourceTokenModal(source);
	const availableSync = useAvailableSync();
	const disabled = disable || !availableSync;

	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
	useEffect(() => {
		const handleSyncStart = () => {
			if (!syncProcess) {
				SyncIconService.start();
			}
		};

		const handleSyncFinish = () => {
			SyncIconService.stop();
			updateSyncCount({
				pull: 0,
				push: 0,
				changed: 0,
				hasChanges: false,
				errorMessage: null,
			});
		};

		const handleSyncError = () => {
			SyncIconService.stop();
		};

		const startToken = SyncService.events.on("start", handleSyncStart);
		const finishToken = SyncService.events.on("finish", handleSyncFinish);
		const errorToken = SyncService.events.on("error", handleSyncError);
		const conflictAbortedToken = SyncService.events.on("conflict-aborted", () => SyncIconService.stop());

		return () => {
			SyncService.events.off(startToken);
			SyncService.events.off(finishToken);
			SyncService.events.off(errorToken);
			SyncService.events.off(conflictAbortedToken);
		};
	}, [syncProcess]);

	const handleSyncClick = useCallback(async () => {
		if (source?.isInvalid) {
			openRestoreSourceModal();
			return;
		}

		await SyncService.sync(apiUrlCreator);
	}, [source?.isInvalid, openRestoreSourceModal, apiUrlCreator]);

	return (
		<SyncLayout
			disabled={disabled}
			onClick={handleSyncClick}
			pullCounter={syncCount?.pull || 0}
			pushCounter={syncCount?.push || 0}
			sourceInvalid={source?.isInvalid}
			style={{ ...(style || {}), opacity: disabled ? 0.5 : 1 }}
			syncProccess={syncProcess}
		/>
	);
};

export default Sync;
