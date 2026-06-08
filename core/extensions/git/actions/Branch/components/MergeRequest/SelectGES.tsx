import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import { SelectApproversInput } from "@ext/git/actions/Branch/components/MergeRequest/SelectApproversInput";
import type { Signature } from "@ext/git/core/model/Signature";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuEmptyItem,
	DropdownMenuSearchItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	useSearchableMenu,
} from "@ui-kit/Dropdown";
import { InputGroupButton } from "@ui-kit/Input";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { useCallback, useMemo, useRef, useState } from "react";

interface SelectGESProps {
	approvers?: { label: string; value: string }[];
	preventSearchAndStartLoading: boolean;
	onChange: (approvers: { label: string; value: string }[]) => void;
}

const SelectGES = ({ approvers, onChange, preventSearchAndStartLoading }: SelectGESProps) => {
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
	const enterpriseSource = getEnterpriseSourceData(SourceDataService.value, gesUrl);
	const [options, setOptions] = useState<Signature[]>([]);
	const [enterpriseApi] = useState(() => new EnterpriseApi(gesUrl));
	const [isLoading, setIsLoading] = useState(false);
	const searchInputRef = useRef<HTMLInputElement>(null);

	const { start } = useDebounce(async () => {
		const value = searchInputRef.current?.value || "";
		setIsLoading(true);
		const users = await enterpriseApi.getUsers(value, enterpriseSource?.token ?? "");
		setIsLoading(false);
		setOptions(users);
	}, 200);

	const { search, setSearch, contentRef, inputRef, handleContentKeyDown, handleInputKeyDown, filterItems } =
		useSearchableMenu();

	const filteredOptions = useMemo(
		() =>
			filterItems(
				options.map((author) => ({
					...author,
					label: `${author.name} ${author.email}`,
					checked: approvers?.some((a) => a.value === AuthorInfoCodec.serialize(author)),
				})),
			),
		[options, approvers, filterItems],
	);

	const onCheckboxChange = useCallback(
		(author: Signature) => {
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

	return (
		<SelectApproversInput approvers={approvers} onChange={onChange}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<div>
						<InputGroupButton icon="search" />
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-72" onKeyDown={handleContentKeyDown} ref={contentRef}>
					<DropdownMenuSearchItem
						onChange={(e) => {
							setSearch(e.target.value);
							searchInputRef.current = e.target as HTMLInputElement;
							if (!preventSearchAndStartLoading) start();
						}}
						onClick={(e) => e.stopPropagation()}
						onKeyDown={handleInputKeyDown}
						placeholder={t("search.placeholder")}
						ref={inputRef}
						value={search}
					/>
					<DropdownMenuSeparator />
					{isLoading
						? null
						: filteredOptions.map((author) => (
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
					{!filteredOptions.length && !isLoading && (
						<DropdownMenuEmptyItem>{t("list.no-results-found")}</DropdownMenuEmptyItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</SelectApproversInput>
	);
};

export default SelectGES;
