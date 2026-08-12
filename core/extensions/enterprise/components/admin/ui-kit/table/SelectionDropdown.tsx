import t from "@ext/localization/locale/translate";
import { Counter } from "@ui-kit/Counter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTriggerButton } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon/Icon";
import type { ReactNode } from "react";

interface SelectionDropdownProps {
	selectedCount: number;
	children: ReactNode;
}

export const SelectionDropdown = ({ selectedCount, children }: SelectionDropdownProps) => {
	if (selectedCount === 0) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton className="pl-2.5 pr-2" variant="outline">
				{t("enterprise.admin.selected")}
				<Counter className="tabular-nums p-0 min-w-0" variant="text">
					{selectedCount}
				</Counter>
				<Icon icon="chevron-down" />
			</DropdownMenuTriggerButton>
			<DropdownMenuContent align="start" className="font-sans font-normal">
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export const DeleteDropdownItem = ({ onSelect, disabled }: { onSelect: () => void; disabled?: boolean }) => (
	<DropdownMenuItem disabled={disabled} onSelect={onSelect} type="danger">
		<Icon icon="trash" />
		{t("delete")}
	</DropdownMenuItem>
);

export const EditDropdownItem = ({ onSelect }: { onSelect: () => void }) => (
	<DropdownMenuItem onSelect={onSelect}>
		<Icon icon="pen" />
		{t("edit2")}
	</DropdownMenuItem>
);

export const AddToAllDropdownItem = ({ onSelect, disabled }: { onSelect: () => void; disabled?: boolean }) => (
	<DropdownMenuItem disabled={disabled} onSelect={onSelect}>
		<Icon icon="copy-plus" />
		{t("enterprise.admin.coverage.add-to-all")}
	</DropdownMenuItem>
);
