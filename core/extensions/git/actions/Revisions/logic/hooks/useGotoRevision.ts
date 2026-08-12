import { useRouter } from "@core/Api/useRouter";
import { useDeferApi } from "@core-ui/hooks/useApi";
import { useCallback } from "react";

export const useGotoRevision = () => {
	const router = useRouter();
	const { call: gotoRevision } = useDeferApi<string, string>({
		onDone: (pathname) => {
			const hasCommitOid = pathname.includes("commit-") || pathname.includes("dif-");
			if (hasCommitOid) {
				router.pushPath(pathname, { diff: "1" });
			} else {
				router.pushPath(pathname);
			}
		},
	});

	return useCallback(
		(commitOid: string, oldCommitOid?: string) =>
			gotoRevision({ url: (api) => api.getPathnameToRevision(commitOid, oldCommitOid) }),
		[gotoRevision],
	);
};
