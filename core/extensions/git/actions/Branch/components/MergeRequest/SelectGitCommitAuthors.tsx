import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import useGitCommitAuthors from "@ext/git/actions/Branch/components/useGitCommitAuthors";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuEmptyItem,
	DropdownMenuSearchItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
	useSearchableMenu,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { SearchSelectTag } from "@ui-kit/SearchSelect";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { useCallback, useMemo } from "react";

interface SelectGitCommitAuthorsProps {
	approvers?: { label: string; value: string }[];
	shouldFetch: boolean;
	onChange: (reviewers: { label: string; value: string }[]) => void;
}

interface SelectAuthorsProps {
	shouldFetch: boolean;
	approvers: { label: string; value: string }[];
	onChange: (approvers: { label: string; value: string }[]) => void;
}

const SelectAuthors = ({ shouldFetch, approvers, onChange }: SelectAuthorsProps) => {
	const { authors } = useGitCommitAuthors(shouldFetch);

	const { search, setSearch, contentRef, inputRef, handleContentKeyDown, handleInputKeyDown, filterItems } =
		useSearchableMenu();

	const filteredAuthors = useMemo(
		() =>
			filterItems(
				authors.map((author) => ({
					...author,
					label: `${author.name} ${author.email}`,
					checked: approvers?.some((a) => a.value === AuthorInfoCodec.serialize(author)),
				})),
			),
		[authors, approvers, filterItems],
	);

	const onCheckboxChange = useCallback(
		(author: (typeof authors)[number]) => {
			const encoded = AuthorInfoCodec.serialize(author);
			const exists = approvers?.some((a) => a.value === encoded);
			if (exists) {
				onChange(approvers?.filter((a) => a.value !== encoded));
			} else {
				onChange([...(approvers || []), { label: author.name, value: encoded }]);
			}
		},
		[approvers, onChange],
	);

	if (!authors?.length) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton className="justify-start pl-2">
				<Icon icon="user" />
				{t("git.merge.add-user")}
			</DropdownMenuTriggerButton>
			<DropdownMenuContent
				className="w-[var(--radix-dropdown-menu-trigger-width)]"
				onKeyDown={handleContentKeyDown}
				ref={contentRef}
			>
				<DropdownMenuSearchItem
					onChange={(e) => setSearch(e.target.value)}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={handleInputKeyDown}
					placeholder={t("search.placeholder")}
					ref={inputRef}
					value={search}
				/>
				<DropdownMenuSeparator />
				{filteredAuthors.map((author) => (
					<DropdownMenuCheckboxItem
						checked={author.checked}
						key={author.email}
						onSelect={(e) => {
							e.preventDefault();
							onCheckboxChange(author);
						}}
					>
						<TextOverflowTooltip>{author.email}</TextOverflowTooltip>
					</DropdownMenuCheckboxItem>
				))}
				{!filteredAuthors.length && <DropdownMenuEmptyItem>{t("list.no-results-found")}</DropdownMenuEmptyItem>}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const SelectGitCommitAuthors = ({ shouldFetch, approvers, onChange }: SelectGitCommitAuthorsProps) => {
	const handleRemove = useCallback(
		(tag: { label: string; value: string }) => {
			onChange(approvers.filter((a) => a.value !== tag.value));
		},
		[approvers, onChange],
	);

	const handleTagKeyDown = useCallback(
		(tag: { label: string; value: string }) => (event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === "Enter") handleRemove(tag);
		},
		[handleRemove],
	);

	return (
		<div className="flex flex-col gap-2">
			<SelectAuthors approvers={approvers} onChange={onChange} shouldFetch={shouldFetch} />
			{approvers?.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{approvers?.map((tag) => (
						<SearchSelectTag
							key={tag.value}
							onClose={() => handleRemove(tag)}
							onKeyDown={handleTagKeyDown(tag)}
							onLabelClick={() => {}}
							tabIndex={0}
						>
							<TextOverflowTooltip className="min-w-0 flex-1 truncate">{tag.label}</TextOverflowTooltip>
						</SearchSelectTag>
					))}
				</div>
			)}
		</div>
	);
};

export default SelectGitCommitAuthors;
