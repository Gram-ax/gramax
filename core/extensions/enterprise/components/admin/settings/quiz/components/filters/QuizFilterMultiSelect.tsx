import { ReactNode, useCallback, useState } from "react";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import useWatch from "@core-ui/hooks/useWatch";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { Button } from "@ui-kit/Button";
import { Command, CommandList, CommandInput, CommandEmpty, CommandItem } from "@ui-kit/Command";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { Loader } from "@ui-kit/Loader";
import { Checkbox } from "@ui-kit/Checkbox";
import { LoadOptionsResult } from "@ui-kit/AsyncSearchSelect";
import t from "@ext/localization/locale/translate";

interface FilterMultiSelectProps {
	existingOptions: string[];
	trigger: ReactNode;
	searchPlaceholder?: string;
	loadingPlaceholder?: string;
	emptyPlaceholder?: string;
	disabled: boolean;
	loadOptions: (params: { searchQuery: string }) => Promise<LoadOptionsResult<SearchSelectOption>>;
	onAdd: (tests: string[]) => void;
	onRemove: (tests: string[]) => void;
}

export const FilterMultiSelect = (props: FilterMultiSelectProps) => {
	const {
		onAdd,
		onRemove,
		existingOptions = [],
		loadOptions,
		trigger,
		searchPlaceholder = t("find2"),
		loadingPlaceholder = t("loading2"),
		emptyPlaceholder = t("empty"),
		disabled,
	} = props;
	const [isLoading, setIsLoading] = useState(false);
	const [options, setOptions] = useState<SearchSelectOption[]>([]);
	const [selectedOptions, setSelectedOptions] = useState<SearchSelectOption[]>([]);

	const { start: debouncedLoadOptions, cancel: cancelDebouncedLoadOptions } = useDebounce(
		(value: string) => {
			loadOptions({ searchQuery: value }).then(({ options: newOptions }) => {
				setOptions(newOptions);
				setIsLoading(false);
			});
		},
		250,
		true,
	);

	useWatch(() => {
		if (!existingOptions?.length) setSelectedOptions([]);
	}, [existingOptions?.length]);

	const handleTestsChange = useCallback(
		(newOption: SearchSelectOption) => {
			setSelectedOptions((prevOptions) => {
				const isExist = prevOptions.includes(newOption);
				const newOptions = isExist
					? prevOptions.filter((option) => option.value !== newOption.value)
					: [...prevOptions, newOption];

				const testsToAdd = newOptions.map((test) => String(test.value));
				isExist ? onRemove(testsToAdd) : onAdd(testsToAdd);
				return newOptions;
			});
		},
		[onAdd, onRemove],
	);

	const onSearchChange = useCallback(
		(value: string) => {
			setIsLoading(true);
			cancelDebouncedLoadOptions();
			debouncedLoadOptions(value);
		},
		[cancelDebouncedLoadOptions, debouncedLoadOptions],
	);

	const handleOpenChange = useCallback(
		async (open: boolean) => {
			if (!open) return;
			setIsLoading(true);

			const data = await loadOptions({ searchQuery: "" });
			setOptions(data.options);
			setIsLoading(false);
		},
		[loadOptions],
	);

	return (
		<>
			<Popover onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					<Button startIcon="book-check" variant="outline" endIcon="chevron-down" disabled={disabled}>
						{trigger} {selectedOptions.length > 0 ? `(${selectedOptions.length})` : ""}
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="p-0">
					<Command shouldFilter={false}>
						<CommandInput
							placeholder={searchPlaceholder}
							autoFocus
							onValueChange={(e) => {
								onSearchChange(e);
							}}
						/>
						<CommandList>
							{isLoading ? (
								<CommandEmpty>
									<Loader />
									{loadingPlaceholder}
								</CommandEmpty>
							) : (
								<CommandEmpty>{emptyPlaceholder}</CommandEmpty>
							)}
							{!isLoading &&
								options.map((option) => (
									<CommandItem key={option.value} onSelect={() => handleTestsChange(option)}>
										<Checkbox checked={selectedOptions.includes(option)} />
										<TextOverflowTooltip className="max-w-full truncate w-full">
											{option.label}
										</TextOverflowTooltip>
									</CommandItem>
								))}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</>
	);
};
