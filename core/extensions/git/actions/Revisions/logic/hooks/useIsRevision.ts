import { useRouter } from "@core/Api/useRouter";
import getCommitOidFromPathname from "@ext/git/actions/Revisions/logic/utils/getCommitOidFromPathname";
import { useMemo } from "react";

export const useIsRevision = () => {
	const router = useRouter();

	const hasCommit = useMemo(
		() => getCommitOidFromPathname(router.query?.scope) || getCommitOidFromPathname(router.path),
		[router.path, router.query?.scope],
	);

	return !!hasCommit;
};
