import { useDebounceValue } from "@core-ui/hooks/useDebounceValue";
import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import { useReviewStore } from "@ext/review/logic/store/ReviewStore";
import { Icon } from "@ui-kit/Icon";
import { TextInput } from "@ui-kit/Input";
import { useState } from "react";

export const ReviewItemSearcher = () => {
	const { setSearchQuery } = useReviewStore((s) => ({
		setSearchQuery: s.setSearchQuery,
	}));

	const [searchInput, setSearchInput] = useState("");
	const { value: debouncedSearch } = useDebounceValue(searchInput, 300);

	useWatch(() => {
		setSearchQuery(debouncedSearch);
	}, [debouncedSearch]);

	return (
		<div className="py-1.5 px-3">
			<TextInput
				className="!h-8 text-sm w-full hover:!shadow-none focus:!shadow-none !shadow-none bg-[var(--color-code-bg)] border-none has-[input:focus]:!bg-[var(--color-code-bg)]"
				onChange={setSearchInput}
				placeholder={t("editor.modes.search-placeholder")}
				startIcon={<Icon className="text-muted h-3.5 w-3.5" icon="search" />}
				value={searchInput}
			/>
		</div>
	);
};
