import { useRouter } from "@core/Api/useRouter";
import { useDiffViewMode } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useMemo } from "react";

export const useToolbarMode = () => {
	const diffView = useDiffViewMode();
	const router = useRouter();

	return useMemo(
		() =>
			router.query.mode !== "markdown" &&
			(router.query.mode !== "diff" || (diffView !== "single-panel" && diffView !== "double-panel")),
		[router.query.mode, diffView],
	);
};
