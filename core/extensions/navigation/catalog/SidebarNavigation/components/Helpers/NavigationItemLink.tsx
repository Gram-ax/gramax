import Link from "@components/Atoms/Link";
import Url from "@core-ui/ApiServices/Types/Url";
import { isOwnedByControl } from "@ext/navigation/catalog/SidebarNavigation/hooks/useNavigationItemClick";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import type { ReactNode } from "react";

interface NavigationItemLinkProps {
	data: ItemLink;
	disabled?: boolean;
	children: ReactNode;
}

export const NavigationItemLink = ({ data, disabled, children }: NavigationItemLinkProps) => {
	if (disabled) return <>{children}</>;

	return (
		<Link
			href={Url.from(data)}
			onClick={(e) => {
				if (!isOwnedByControl(e)) return;
				e.preventDefault();
				e.stopPropagation();
			}}
		>
			{children}
		</Link>
	);
};
