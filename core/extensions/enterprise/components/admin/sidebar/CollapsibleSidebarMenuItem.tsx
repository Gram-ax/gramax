import { CollapsibleTrigger } from "@ui-kit/Collapsible";
import { SidebarMenuItem } from "@ui-kit/Sidebar";
import type { ReactNode } from "react";

export const CollapsibleSidebarMenuItem = ({ children }: { children: ReactNode }) => (
	<CollapsibleTrigger asChild>
		<SidebarMenuItem>{children}</SidebarMenuItem>
	</CollapsibleTrigger>
);
