import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Fetcher from "@core-ui/ApiServices/Types/Fetcher";
import UseSWRService from "@core-ui/ApiServices/UseSWRService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsOfflineService from "@core-ui/ContextServices/IsOfflineService";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import SyncLayout from "@ext/git/actions/Sync/components/SyncLayout";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import { CSSProperties, useEffect, useState } from "react";
import { SWRResponse } from "swr";
import useIsReview from "../../../../storage/logic/utils/useIsReview";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";

const Sync = ({ style }: { style?: CSSProperties }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [syncProccess, setSyncProccess] = useState(false);
	const isReview = useIsReview();
	const disableFetch = IsOfflineService.value || PageDataContextService.value.conf.isReadOnly;

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
				setSyncProccess(true);
			},
			onFinishSync: async () => {
				setSyncProccess(false);
				refreshPage();
				await ArticleUpdaterService.update(apiUrlCreator);
			},
			onSyncError: () => {
				setSyncProccess(false);
			},
		});
	}, []);

	return (
		<SyncLayout
			pullCounter={syncCount?.pull}
			pushCounter={syncCount?.push}
			syncProccess={syncProccess}
			onClick={() => SyncService.sync(apiUrlCreator, isReview)}
			style={style}
		/>
	);
};

export default Sync;
