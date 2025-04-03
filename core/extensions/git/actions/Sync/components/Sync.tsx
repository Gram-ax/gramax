import Fetcher from "@core-ui/ApiServices/Types/Fetcher";
import UseSWRService from "@core-ui/ApiServices/UseSWRService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsOfflineService from "@core-ui/ContextServices/IsOfflineService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import SyncLayout from "@ext/git/actions/Sync/components/SyncLayout";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import useSourceData from "@ext/storage/components/useSourceData";
import { useOpenRestoreSourceTokenModal } from "@ext/storage/logic/SourceDataProvider/components/useOpenRestoreSourceTokenModal";
import { CSSProperties, useEffect } from "react";
import { SWRResponse } from "swr";

const Sync = ({ style }: { style?: CSSProperties }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const syncProccess = SyncIconService.value;
	const pageDataContext = PageDataContextService.value;
	const disableFetch = IsOfflineService.value || pageDataContext.conf.isReadOnly || !pageDataContext.userInfo;

	const source = useSourceData();
	const openRestoreSourceModal = useOpenRestoreSourceTokenModal(source);

	const { data: syncCount }: SWRResponse<{ pull: 0; push: 0 }, any> = UseSWRService.getData<{ pull: 0; push: 0 }>(
		disableFetch ? null : apiUrlCreator.getSyncCountUrl(),
		Fetcher.json,
		true,
		{ refreshInterval: 3000 },
	);

	useEffect(() => {
		const startToken = SyncService.events.on("start", () => {
			if (syncProccess) return;
			SyncIconService.start();
		});
		const finishToken = SyncService.events.on("finish", () => {
			SyncIconService.stop();
		});
		const errorToken = SyncService.events.on("error", () => {
			SyncIconService.stop();
		});

		return () => {
			SyncService.events.off(startToken);
			SyncService.events.off(finishToken);
			SyncService.events.off(errorToken);
		};
	}, [syncProccess]);

	return (
		<SyncLayout
			pullCounter={syncCount?.pull}
			pushCounter={syncCount?.push}
			syncProccess={syncProccess}
			sourceInvalid={source?.isInvalid}
			onClick={() => (source?.isInvalid ? openRestoreSourceModal() : SyncService.sync(apiUrlCreator))}
			style={style}
		/>
	);
};

export default Sync;
