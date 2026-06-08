import { useRouter } from "@core/Api/useRouter";
import { useDeferApi } from "@core-ui/hooks/useApi";
import { useCallback } from "react";

export const useGotoRevision = () => {
	const router = useRouter();
	const { call: gotoRevision } = useDeferApi<string, string>({
		onDone: (pathname) => {
			router.pushPath(pathname);
		},
	});

	return useCallback(
		(commitOid: string) => gotoRevision({ url: (api) => api.getPathnameToRevision(commitOid) }),
		[gotoRevision],
	);
};
