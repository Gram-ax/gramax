import { useRouter } from "@core/Api/useRouter";
import { useIsDoublePanel } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useMemo } from "react";

export const useToolbarMode = () => {
	const router = useRouter();
	const isDoublePanel = useIsDoublePanel();

	return useMemo(
		() => router.query.mode !== "markdown" && (!isDoublePanel || router.query.diff !== "1"),
		[router.query.mode, router.query.diff, isDoublePanel],
	);
};
