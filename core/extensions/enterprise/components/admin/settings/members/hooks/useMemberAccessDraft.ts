import { getAccessRowId, type MemberAccess } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { repoColumn } from "@ext/enterprise/components/admin/settings/resources/model/repoColumn";
import { useCallback, useMemo } from "react";
import { type UseAccessDraftArgs, useAccessDraft } from "./useAccessDraft";

type UseMemberAccessDraftArgs = Omit<UseAccessDraftArgs<MemberAccess>, "getId">;

export const useMemberAccessDraft = (args: UseMemberAccessDraftArgs) => {
	const result = useAccessDraft({ ...args, getId: getAccessRowId });

	const add = useCallback(
		(grants: MemberAccess[]) => {
			result.add(grants);
		},
		[result.add],
	);

	const columns = useMemo(
		() => [
			repoColumn<MemberAccess>({
				getValue: (row) => row.resourceId,
			}),
			...result.columns,
		],
		[result.columns],
	);

	return { ...result, add, columns };
};
