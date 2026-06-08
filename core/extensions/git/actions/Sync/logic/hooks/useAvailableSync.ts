import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";

export const useAvailableSync = () => {
	const isRevision = useIsRevision();

	return !isRevision;
};
