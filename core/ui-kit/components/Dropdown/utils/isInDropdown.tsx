import { isFromModal } from "@ui-kit/Modal";
import { MouseEvent } from "react";

export const isInDropdown = (e: MouseEvent<HTMLElement>): boolean => {
	const target = e.target as HTMLElement;
	const isInRightExtensions = Boolean(target.closest(".right-extensions"));
	const isInRadixContent = Boolean(target.closest("[data-dropdown-menu-content='true']"));

	return isInRightExtensions || isFromModal(e) || isInRadixContent;
};
