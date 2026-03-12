import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { type ReactNode, useCallback, useState } from "react";

type DropdownOption = {
	value: string;
	label: ReactNode;
};

interface QuizFilterDropdownProps {
	value: string[];
	trigger: ReactNode;
	disabled: boolean;
	multiple?: boolean;
	options: DropdownOption[];
	inverseCounter?: boolean;
	icon?: string;
	onClear: () => void;
	onAdd: (options: string[]) => void;
	onRemove: (options: string[]) => void;
}

export const QuizFilterDropdown = (props: QuizFilterDropdownProps) => {
	const {
		value: propsValue,
		trigger,
		disabled,
		options,
		onAdd,
		onRemove,
		onClear,
		multiple = false,
		icon = "book-check",
		inverseCounter = false,
	} = props;
	const [selectedOptions, setSelectedOptions] = useState<string[]>(propsValue);

	useWatch(() => {
		setSelectedOptions(propsValue);
	}, [propsValue]);

	const onValueChange = useCallback(
		(value: string) => {
			setSelectedOptions((prev) => {
				if (multiple) {
					const isExist = prev.includes(value);
					const newOptions = isExist ? prev.filter((option) => option !== value) : [...prev, value];
					isExist ? onRemove(newOptions) : onAdd(newOptions);
					return newOptions;
				}

				const isExist = prev.includes(value);
				isExist ? onRemove([]) : onAdd([value]);
				return [value];
			});
		},
		[onAdd, onRemove, multiple],
	);

	const preventCloseOnSelect = useCallback((e: Event) => {
		e.preventDefault();
	}, []);

	const selectedCount = inverseCounter ? options.length - selectedOptions.length : selectedOptions.length;
	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button disabled={disabled} endIcon="chevron-down" startIcon={icon} variant="outline">
					{trigger} {selectedCount > 0 ? `(${selectedCount})` : ""}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{!multiple ? (
					<DropdownMenuRadioGroup onValueChange={onValueChange} value={selectedOptions[0]}>
						{options.map((option) => (
							<DropdownMenuRadioItem
								key={option.value}
								onSelect={preventCloseOnSelect}
								value={option.value}
							>
								{option.label}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				) : (
					options.map((option) => (
						<DropdownMenuCheckboxItem
							checked={selectedOptions.includes(option.value)}
							key={option.value}
							onCheckedChange={() => onValueChange(option.value)}
							onSelect={preventCloseOnSelect}
						>
							{option.label}
						</DropdownMenuCheckboxItem>
					))
				)}
				{onClear && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={onClear}>
							<Icon icon="trash" />
							{t("clear")}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
