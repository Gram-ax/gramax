import { useRouter } from "@core/Api/useRouter";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { useDiffStore } from "@core-ui/stores/DiffStore/DiffStore.provider";
import { useResourceDiffEnabled } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useMemo } from "react";

export const useIsDiffView = () => {
	const router = useRouter();
	const articleView = ArticleViewService.value;
	const isReadOnly = PageDataContext?.value?.conf?.isReadOnly;
	const resourceDiffEnabled = useResourceDiffEnabled();
	const diffEnabled = useDiffStore((state) => !!state?.diff);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	return useMemo(
		() => resourceDiffEnabled || (diffEnabled && !isReadOnly),
		[resourceDiffEnabled, router.query.diff, articleView, isReadOnly],
	);
};
