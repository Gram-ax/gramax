import { useRouter } from "@core/Api/useRouter";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { useDiffEnabled } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useMemo } from "react";

export const useIsDiffView = () => {
	const router = useRouter();
	const articleView = ArticleViewService.value;
	const isReadOnly = PageDataContext.value.conf.isReadOnly;
	const diffEnabled = useDiffEnabled();

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	return useMemo(
		() => diffEnabled || (router.query.mode === "diff" && !isReadOnly),
		[diffEnabled, router.query.mode, articleView, isReadOnly],
	);
};
