import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogFetchTimersService from "@core-ui/ContextServices/CatalogFetchTimers";
import isOfflineService from "@core-ui/ContextServices/IsOfflineService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useIsRepoOk } from "@ext/storage/logic/utils/useStorage";
import { useEffect, useRef } from "react";

const useFetchCatalog = () => {
	const catalogProps = useCatalogPropsStore((state) => state.data, "shallow");
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isOffline = isOfflineService.value;
	const isRepoOk = useIsRepoOk(catalogProps) && !!catalogProps?.name;
	const isRepoOkRef = useRef<boolean>(isRepoOk);
	const readOnly = PageDataContextService.value.conf.isReadOnly;

	const fetchCatalog = async () => {
		if (
			!catalogProps?.name ||
			isOffline ||
			!isRepoOkRef.current ||
			readOnly ||
			!CatalogFetchTimersService.canFetch(catalogProps.name)
		)
			return;

		SyncIconService.start();
		const res = await FetchService.fetch(apiUrlCreator.getStorageFetch());
		SyncIconService.stop();
		if (!res) return;
		CatalogFetchTimersService.setTimer(catalogProps.name);
	};

	useEffect(() => {
		isRepoOkRef.current = isRepoOk;
	}, [isRepoOk]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (document.hidden) return;
			fetchCatalog();
		}, CatalogFetchTimersService.fetchIntervalDelay);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		fetchCatalog();
	}, [catalogProps]);

	useEffect(() => {
		window.addEventListener("focus", fetchCatalog);
		return () => {
			window.removeEventListener("focus", fetchCatalog);
		};
	});
};

export default useFetchCatalog;
