import { useEditorSheet } from "@ext/enterprise/components/admin/settings/members/hooks/useEditorSheet";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { GesRepo, MemberAggregate } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useRepoFormState } from "@ext/enterprise/components/admin/settings/resources/hooks/useRepoFormState";
import { buildRepoChanges } from "@ext/enterprise/components/admin/settings/resources/model/buildRepoChanges";
import { useCallback } from "react";

interface UseRepoCardArgs {
	repo?: GesRepo;
	aggregate: MemberAggregate;
	repoCandidates: string[];
	onClose: () => void;
	onApply: (changes: AccessChange[]) => Promise<void>;
}

export const useRepoCard = (args: UseRepoCardArgs) => {
	const { aggregate, onApply, onClose, repo, repoCandidates } = args;
	const isAdd = !repo;

	const repoFormState = useRepoFormState({
		aggregate,
		repo,
		repoCandidates,
	});

	const buildChanges = useCallback(() => {
		const orig = repo ? aggregate.repoAccesses.get(repo?.id) : undefined;
		return buildRepoChanges({
			repoId: repoFormState.data.repoId,
			mainBranch: repoFormState.data.branchValue,
			branchProtected: repoFormState.data.branchProtected,
			origMainBranch: repo?.mainBranch,
			origBranchProtected: repo?.mainBranchProtected,
			isAdd: !repo,
			origGroupAccess: orig?.groups ?? [],
			origUserAccess: orig?.users ?? [],
			origGuestAccess: orig?.guests ?? [],
			draftGroupAccess: repoFormState.groupAccess.rows,
			draftUserAccess: repoFormState.userAccess.rows,
			draftGuestAccess: repoFormState.guestAccess.rows,
		});
	}, [
		repo,
		repoFormState.data.repoId,
		repoFormState.data.branchProtected,
		repoFormState.data.branchValue,
		repoFormState.groupAccess.rows,
		repoFormState.userAccess.rows,
		repoFormState.guestAccess.rows,
		aggregate.repoAccesses,
	]);

	const validate = useCallback(async () => {
		const accessesValid =
			repoFormState.groupAccess.validate() &&
			repoFormState.userAccess.validate() &&
			repoFormState.guestAccess.validate();
		return accessesValid;
	}, [repoFormState.groupAccess.validate, repoFormState.userAccess.validate, repoFormState.guestAccess.validate]);

	const { saving, saveError, showUnsaved, setShowUnsaved, hasChanges, requestClose, persist, submit, close } =
		useEditorSheet({
			buildChanges,
			apply: onApply,
			onClose,
			validate,
		});

	return {
		form: {
			saving,
			saveError,
			showUnsaved,
			setShowUnsaved,
			hasChanges,
			requestClose,
			persist,
			submit,
			close,
		},
		repoFormState,
		isAdd,
	};
};
