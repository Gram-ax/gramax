import { useRouter } from "@core/Api/useRouter";
import { useIsDoublePanel } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useIsDiffView } from "@ext/git/core/Diff/logic/hooks/useIsDiffView";

export const useDiffMode = () => {
	const router = useRouter();
	const isDoublePanel = useIsDoublePanel();
	const isDiff = useIsDiffView();
	const isMarkdown = router.query?.mode === "markdown";

	return { isDiff, isDoublePanel, isMarkdown, isWysiwyg: !isMarkdown };
};
