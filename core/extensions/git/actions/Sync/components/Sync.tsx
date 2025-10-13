import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { useSyncCount } from "@core-ui/ContextServices/SyncCount/useSyncCount";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import SyncLayout from "@ext/git/actions/Sync/components/SyncLayout";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import useSourceData from "@ext/storage/components/useSourceData";
import { useOpenRestoreSourceTokenModal } from "@ext/storage/logic/SourceDataProvider/components/useOpenRestoreSourceTokenModal";
import { CSSProperties, useCallback, useEffect } from "react";

const Sync = ({ style }: { style?: CSSProperties }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;
	const syncProcess = SyncIconService.value;

	const { syncCount, updateSyncCount } = useSyncCount(catalogProps.name);

	const source = useSourceData();
	const openRestoreSourceModal = useOpenRestoreSourceTokenModal(source);

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

		return () => {
			SyncService.events.off(startToken);
			SyncService.events.off(finishToken);
			SyncService.events.off(errorToken);
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
			pullCounter={syncCount?.pull || 0}
			pushCounter={syncCount?.push || 0}
			syncProccess={syncProcess}
			sourceInvalid={source?.isInvalid}
			onClick={handleSyncClick}
			style={style}
		/>
	);
};

export default Sync;
