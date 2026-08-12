import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { useDiffStore } from "@core-ui/stores/DiffStore/DiffStore.provider";
import { useEffect, useRef } from "react";

export const useResetArticleView = () => {
	const prevDiff = useRef<boolean>(null);
	const diffEnabled = useDiffStore((state) => !!state?.diff);

	useEffect(() => {
		const wasDiff = prevDiff.current;
		const isDiff = diffEnabled;

		if (wasDiff && !isDiff) {
			ArticleViewService.setDefaultView();
			ArticleViewService.useArticleDefaultStyles = true;
		}

		prevDiff.current = diffEnabled;
	}, [diffEnabled]);
};
