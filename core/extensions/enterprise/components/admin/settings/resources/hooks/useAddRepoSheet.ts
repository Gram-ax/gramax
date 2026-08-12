import type { LoadOptionsParams, LoadOptionsResult } from "@ui-kit/AsyncSearchSelect";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useCallback, useEffect, useState } from "react";

interface UseAddRepoSheetArgs {
	open: boolean;
	repoCandidates: string[];
	onOpenChange: (open: boolean) => void;
	onCreate: (resourceId: string) => void;
}

export const useAddRepoSheet = (args: UseAddRepoSheetArgs) => {
	const { open, repoCandidates, onOpenChange, onCreate } = args;
	const [repository, setRepository] = useState<SearchSelectOption | null>(null);

	useEffect(() => {
		if (!open) return;
		setRepository(null);
	}, [open]);

	const loadRepoOptions = useCallback(
		async ({ searchQuery }: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
			const query = searchQuery.toLowerCase();
			const options = repoCandidates
				.filter((x) => x.toLowerCase().includes(query))
				.map((x) => ({ value: x, label: x }));
			return { options };
		},
		[repoCandidates],
	);

	const handleSave = () => {
		const id = String(repository?.value ?? "");
		if (!id) return;
		onCreate(id);
		onOpenChange(false);
	};

	return { repository, setRepository, loadRepoOptions, handleSave };
};
