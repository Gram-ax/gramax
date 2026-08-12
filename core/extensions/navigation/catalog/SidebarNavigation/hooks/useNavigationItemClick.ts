import useHandleItemClick from "@core-ui/hooks/useHandleItemClick";
import { isInDropdown } from "@ui-kit/Dropdown";
import { type MouseEvent, useCallback } from "react";

interface NavigationItemClickParams {
	itemPath: string;
	isSelected: boolean;
	onSelect: () => void;
}

const isOwnedByControl = (e: MouseEvent<HTMLElement>) =>
	isInDropdown(e) || !!(e.target as HTMLElement).closest("[data-collapsible-trigger]");

export const useNavigationItemClick = ({ itemPath, isSelected, onSelect }: NavigationItemClickParams) => {
	const handleItemClick = useHandleItemClick({
		itemPath,
		toggleFunction: onSelect,
		isCurrentLink: isSelected,
	});

	return useCallback(
		(e: React.MouseEvent) => {
			if (isOwnedByControl(e as MouseEvent<HTMLElement>)) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			handleItemClick(e);
		},
		[handleItemClick],
	);
};

export { isOwnedByControl };
