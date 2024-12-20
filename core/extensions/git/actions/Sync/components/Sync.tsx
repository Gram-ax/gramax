import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Fetcher from "@core-ui/ApiServices/Types/Fetcher";
import UseSWRService from "@core-ui/ApiServices/UseSWRService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsOfflineService from "@core-ui/ContextServices/IsOfflineService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import MergeConflictConfirm from "@ext/git/actions/MergeConflictHandler/components/MergeConflictConfirm";
import SyncLayout from "@ext/git/actions/Sync/components/SyncLayout";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import { ComponentProps, CSSProperties, useEffect } from "react";
import { SWRResponse } from "swr";

const Sync = ({ style }: { style?: CSSProperties }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const syncProccess = SyncIconService.value;
	const pageDataContext = PageDataContextService.value;
	const disableFetch = IsOfflineService.value || pageDataContext.conf.isReadOnly || !pageDataContext.userInfo;

	const { data: syncCount }: SWRResponse<{ pull: 0; push: 0 }, any> = UseSWRService.getData<{ pull: 0; push: 0 }>(
		disableFetch ? null : apiUrlCreator.getSyncCountUrl(),
		Fetcher.json,
		true,
		{ refreshInterval: 3000 },
	);

	useEffect(() => {
		SyncService.bindOnSyncService({
			onStartSync: () => {
				if (syncProccess) return;
				SyncIconService.start();
			},
			onFinishSync: async (mergeData) => {
				SyncIconService.stop();
				BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.MergeRequest);
				if (!mergeData.ok) {
					ModalToOpenService.setValue<ComponentProps<typeof MergeConflictConfirm>>(ModalToOpen.MergeConfirm, {
						mergeData: { ...mergeData },
					});
					return;
				}
				refreshPage();
				await ArticleUpdaterService.update(apiUrlCreator);
			},
			onSyncError: () => {
				SyncIconService.stop();
			},
		});
	}, [syncProccess]);

	return (
		<SyncLayout
			pullCounter={syncCount?.pull}
			pushCounter={syncCount?.push}
			syncProccess={syncProccess}
			onClick={() => SyncService.sync(apiUrlCreator)}
			style={style}
		/>
	);
};

export default Sync;
