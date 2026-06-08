import { useRouter } from "@core/Api/useRouter";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { useEffect, useRef } from "react";

export const useResetArticleView = () => {
	const prevMode = useRef<string>(null);
	const router = useRouter();

	useEffect(() => {
		const wasModeDiff = prevMode.current === "diff";
		const isDiffMode = router.query.mode === "diff";

		if (wasModeDiff && !isDiffMode) {
			ArticleViewService.setDefaultView();
			ArticleViewService.useArticleDefaultStyles = true;
		}

		prevMode.current = router.query.mode as string;
	}, [router.query]);
};
