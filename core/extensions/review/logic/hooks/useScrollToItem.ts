import { useRouter } from "@core/Api/useRouter";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import { useReviewStore } from "@ext/review/logic/store/ReviewStore";
import { scrollToReviewItem } from "@ext/review/logic/utils/scrollToReviewItem";
import type { ReviewListItem } from "@ext/review/models/ReviewList";
import { useCallback } from "react";

export const useScrollToItem = () => {
	const router = useRouter();
	const articleRef = ArticleRefService.value;
	const setPendingItem = useReviewStore((s) => s.setPendingItem);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const scroll = useCallback((item: ReviewListItem) => {
		const container = articleRef.current;
		if (!container) return;
		const editor = getEditorStore().editor;
		if (!editor) return;
		scrollToReviewItem(container, item, editor);
	}, []);

	return useCallback(
		(item: ReviewListItem) => {
			const currentPath = decodeURIComponent(router.path).replace(/^\//, "");
			const itemPathname = decodeURIComponent(item.pathname).replace(/^\//, "");

			if (currentPath === itemPathname) {
				scroll(item);
			} else {
				setPendingItem(item);
				router.pushPath(item.pathname);
			}
		},
		[router, scroll, setPendingItem],
	);
};
