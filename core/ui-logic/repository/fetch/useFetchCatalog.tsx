import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogFetchTimersSerivce from "@core-ui/ContextServices/CatalogFetchTimers";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsOfflineService from "@core-ui/ContextServices/IsOfflineService";
import { useEffect } from "react";

const useFetchCatalog = () => {
	const catalogName = CatalogPropsService.value?.name;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isOffline = IsOfflineService.value;

	const fetchCatalog = async () => {
		if (!catalogName || !CatalogFetchTimersSerivce.canFetch(catalogName) || isOffline) return;
		const res = await FetchService.fetch(apiUrlCreator.getStorageFetch());
		if (!res) return;
		CatalogFetchTimersSerivce.setTimer(catalogName);
	};

	useEffect(() => {
		const interval = setInterval(() => {
			if (document.hidden) return;
			fetchCatalog();
		}, CatalogFetchTimersSerivce.fetchIntervalDelay);
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
