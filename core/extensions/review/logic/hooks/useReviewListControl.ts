import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { setEditorStore, useEditorStore } from "@core-ui/stores/EditorStore";
import { useEffect } from "react";

export const useReviewListControl = () => {
	const isReadOnly = PageDataContext.value.conf.isReadOnly;
	const review = useEditorStore((s) => s.review);
	const showReview = review && !isReadOnly;

	const catalogName = useCatalogPropsStore((state) => state.data?.name);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (isReadOnly) return;
		setEditorStore({ review: false });
	}, [catalogName]);

	return showReview;
};
