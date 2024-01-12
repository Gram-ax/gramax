import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import FetchService from "@core-ui/ApiServices/FetchService";
import Fetcher from "@core-ui/ApiServices/Types/Fetcher";
import UseSWRService from "@core-ui/ApiServices/UseSWRService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogFetchTimersSerivce from "@core-ui/ContextServices/CatalogFetchTimers";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsOfflineService from "@core-ui/ContextServices/IsOfflineService";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import SyncLayout from "@ext/git/actions/Sync/SyncLayout";
import { CSSProperties, useState } from "react";
import { SWRResponse } from "swr";
import useIsReview from "../../../storage/logic/utils/useIsReview";

const Sync = ({ style }: { style?: CSSProperties }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogName = CatalogPropsService.value.name;
	const [syncProccess, setSyncProccess] = useState(false);
	const isReview = useIsReview();
	const isOffline = IsOfflineService.value;
	const syncUrl = apiUrlCreator.getStorageSyncUrl(!isReview);

	const { data: syncCount }: SWRResponse<{ pull: 0; push: 0 }, any> = UseSWRService.getData<{ pull: 0; push: 0 }>(
		isOffline ? null : apiUrlCreator.getSyncCountUrl(),
		Fetcher.json,
		true,
		{ refreshInterval: 3000 },
	);

	return (
		<SyncLayout
			pullCounter={syncCount?.pull}
			pushCounter={syncCount?.push}
			syncProccess={syncProccess}
			onClick={async () => {
				if (syncProccess) return;
				setSyncProccess(true);
				const response = await FetchService.fetch(syncUrl);
				setSyncProccess(false);
				CatalogFetchTimersSerivce.setTimer(catalogName);
				if (!response.ok) return;

				refreshPage();
				await ArticleUpdaterService.update(apiUrlCreator);
			}}
			style={style}
		/>
	);
};

export default Sync;
