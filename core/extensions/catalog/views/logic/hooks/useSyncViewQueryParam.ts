import { useRouter } from "@core/Api/useRouter";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useApplyView } from "@ext/catalog/views/logic/hooks/useApplyView";
import { useEffect } from "react";

export const useSyncViewQueryParam = () => {
	const router = useRouter();
	const applyView = useApplyView();
	const pageDataContext = PageDataContext.value;
	const { isArticle } = pageDataContext;
	const { resolvedViewId, catalogName } = useCatalogPropsStore((state) => ({
		resolvedViewId: state.data?.resolvedView?.id,
		catalogName: state.data?.name,
	}));

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!isArticle) return;
		const viewId = router.query?.view as string;

		if (viewId && viewId !== resolvedViewId) {
			applyView(viewId);
			return;
		}

		const searchParams = new URLSearchParams(window.location.search);
		if (resolvedViewId && !viewId) {
			searchParams.set("view", resolvedViewId);
		} else if (!resolvedViewId && viewId) {
			searchParams.delete("view");
		}

		const search = searchParams.toString();
		history.replaceState(null, "", window.location.pathname + (search ? `?${search}` : ""));
	}, [catalogName]);
};
