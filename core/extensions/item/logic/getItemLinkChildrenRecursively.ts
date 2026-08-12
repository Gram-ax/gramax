import type { CategoryLink } from "@ext/navigation/NavigationLinks";

export const getItemLinkChildrenRecursively = (itemLink: CategoryLink) => {
	const children = itemLink?.items || [];
	return [...children, ...children.flatMap((child) => getItemLinkChildrenRecursively(child as CategoryLink))];
};
