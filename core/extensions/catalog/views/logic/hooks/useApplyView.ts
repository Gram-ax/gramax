import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useCallback } from "react";

export const useApplyView = () => {
	const apiUrlCreator = ApiUrlCreator.value;
	const resolvedViewId = useCatalogPropsStore((state) => state.data?.resolvedView?.id);

	const applyView = useCallback(
		async (viewId: string) => {
			const url = apiUrlCreator.applyCatalogView(viewId);
			const res = await FetchService.fetch(url);
			if (!res.ok) return;

			const searchParams = new URLSearchParams(window.location.search);
			if (resolvedViewId === viewId) searchParams.delete("view");
			else searchParams.set("view", viewId);

			const search = searchParams.toString();
			history.replaceState(
				null,
				"",
				window.location.pathname + (search ? `?${search}` : "") + window.location.hash,
			);
			refreshPage();
		},
		[apiUrlCreator, resolvedViewId],
	);

	return applyView;
};
