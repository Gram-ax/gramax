import t from "@ext/localization/locale/translate";
import { useReviewAuthors } from "@ext/review/logic/hooks/useReviewAuthors";
import { Checkbox, type CheckedState } from "@ui-kit/Checkbox";
import { Icon } from "@ui-kit/Icon";
import { TextInput } from "@ui-kit/Input";
import { MenuItem } from "@ui-kit/MenuItem";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { type HTMLAttributes, useCallback, useMemo, useState } from "react";

interface ReviewAuthorsFilterProps {
	selectedEmails: string[];
	onChange: (emails: string[]) => void;
}

interface FilterItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	checked?: CheckedState;
	name: string;
}

interface CustomFilterItemProps extends HTMLAttributes<HTMLDivElement> {
	checked: CheckedState;
}

const CustomFilterItem = ({ checked, children, ...props }: CustomFilterItemProps) => {
	return (
		<MenuItem {...props}>
			<Checkbox checked={checked} />
			<span className="font-normal text-primary-fg text-xs">{children}</span>
		</MenuItem>
	);
};

const FilterItem = ({ checked, name, ...props }: FilterItemProps) => {
	return (
		<MenuItem {...props}>
			<Checkbox checked={checked} />
			<span className="font-normal text-primary-fg text-xs">{name}</span>
		</MenuItem>
	);
};

export const ReviewAuthorsFilter = ({ selectedEmails, onChange }: ReviewAuthorsFilterProps) => {
	const authors = useReviewAuthors();
	const [search, setSearch] = useState("");

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return q.length > 0
			? authors.filter((a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
			: authors;
	}, [authors, search]);

	const allSelected = selectedEmails === null ? true : selectedEmails.length === 0 ? false : "indeterminate";

	const toggleAuthor = useCallback(
		(email: string) => {
			const current = selectedEmails ?? authors.map((a) => a.email);
			const isCurrentlySelected = current.includes(email);
			const next = isCurrentlySelected ? current.filter((e) => e !== email) : [...current, email];
			onChange(next.length === authors.length ? null : next);
		},
		[selectedEmails, authors, onChange],
	);

	const handleSelectAll = useCallback(() => {
		onChange(selectedEmails !== null ? null : []);
	}, [onChange, selectedEmails]);

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-xs font-normal uppercase text-muted tracking-wide">
					{t("editor.modes.filters.authors.title")}
				</span>
			</div>
			<TextInput
				className="h-8 text-sm"
				onChange={(value) => setSearch(value)}
				placeholder={t("editor.modes.filters.authors.placeholder")}
				startIcon={<Icon className="text-muted" icon="search" />}
				value={search}
			/>
			<ScrollShadowContainer className="max-h-48 space-y-0.5">
				<CustomFilterItem checked={allSelected} onClick={handleSelectAll}>
					({t("select-all").toLowerCase()})
				</CustomFilterItem>
				{filtered.map((author) => {
					const isSelected = selectedEmails === null || selectedEmails.includes(author.email);
					return (
						<FilterItem
							checked={isSelected}
							key={author.email}
							name={author.name}
							onClick={() => toggleAuthor(author.email)}
						/>
					);
				})}
			</ScrollShadowContainer>
		</div>
	);
};
