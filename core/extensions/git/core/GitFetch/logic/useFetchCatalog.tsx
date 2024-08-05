import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogFetchTimersService from "@core-ui/ContextServices/CatalogFetchTimers";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsOfflineService from "@core-ui/ContextServices/IsOfflineService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageIniziliate";
import { useEffect, useRef } from "react";

const useFetchCatalog = () => {
	const catalogName = CatalogPropsService.value?.name;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isOffline = IsOfflineService.value;
	const isStorageInitialized = useIsStorageInitialized();
	const isStorageInitializedRef = useRef<boolean>(isStorageInitialized);
	const readOnly = PageDataContextService.value.conf.isReadOnly;

	const fetchCatalog = async () => {
		if (
			!catalogName ||
			isOffline ||
			!isStorageInitializedRef.current ||
			readOnly ||
			!CatalogFetchTimersService.canFetch(catalogName)
		)
			return;

		SyncIconService.start();
		const res = await FetchService.fetch(apiUrlCreator.getStorageFetch());
		SyncIconService.stop();
		if (!res) return;
		CatalogFetchTimersService.setTimer(catalogName);
	};

	useEffect(() => {
		isStorageInitializedRef.current = isStorageInitialized;
	}, [isStorageInitialized]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (document.hidden) return;
			fetchCatalog();
		}, CatalogFetchTimersService.fetchIntervalDelay);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		fetchCatalog();
	}, [catalogName]);

	useEffect(() => {
		window.addEventListener("focus", fetchCatalog);
		return () => {
			window.removeEventListener("focus", fetchCatalog);
		};
	});
};

export default useFetchCatalog;
