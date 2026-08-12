import { useRouter } from "@core/Api/useRouter";
import { useDiffStore } from "@core-ui/stores/DiffStore/DiffStore.provider";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import { setDiffEnabled } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useCallback } from "react";

export const useDiffToggle = () => {
	const router = useRouter();
	const isRevision = useIsRevision();
	const diffEnabled = useDiffStore((state) => !!state?.diff);

	return useCallback(() => {
		const enabled = !diffEnabled;
		setDiffEnabled(enabled);
		router.pushQuery({
			...(router.query || {}),
			diff: enabled ? "1" : undefined,
			oldScope: enabled && !isRevision ? "HEAD" : undefined,
		});
	}, [router, isRevision, diffEnabled]);
};
