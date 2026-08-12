import { SIDEBAR_MENU_SUB_INDENT } from "./constants";

// Each SidebarMenuSub adds ml-3.5 (14px) + pl-2.5 (10px) = 24px for each level of nesting
export const getIndicatorOffset = (level: number): string => {
	return `${-(level - 1) * SIDEBAR_MENU_SUB_INDENT}px`;
};
