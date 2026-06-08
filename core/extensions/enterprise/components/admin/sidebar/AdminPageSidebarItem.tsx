import type { AdminNavigateFunction } from "@ext/enterprise/components/admin/hooks/useWorkspaceEditorOptions";
import { AdminSidebarMenuSubButton } from "@ext/enterprise/components/admin/sidebar/AdminSidebarMenuSubButton";
import { CollapsibleSidebarMenuItem } from "@ext/enterprise/components/admin/sidebar/CollapsibleSidebarMenuItem";
import type { AdminGroupPageModel, AdminPageModel } from "@ext/enterprise/model/AdminPageModel";
import type { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { Collapsible, CollapsibleContent } from "@ui-kit/Collapsible";
import { Icon } from "@ui-kit/Icon";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "@ui-kit/Sidebar";
import type { ComponentType, ReactNode } from "react";

export interface AdminPageSidebarItemProps {
	activePage: Page;
	model: AdminPageModel;
	tryNavigate: AdminNavigateFunction;
}

export const AdminPageSidebarItem = ({ activePage, model, tryNavigate }: AdminPageSidebarItemProps) => {
	return model.type === "single" ? (
		<AdminPageSidebarItemInternal
			activePage={activePage}
			ItemComponent={SidebarMenuItem}
			model={model}
			tryNavigate={tryNavigate}
		/>
	) : (
		<AdminPageGroupSidebarItem activePage={activePage} model={model} tryNavigate={tryNavigate} />
	);
};

export interface AdminPageGroupSidebarItemTriggerProps {
	activePage: Page;
	model: AdminGroupPageModel;
	tryNavigate: AdminNavigateFunction;
}

export const AdminPageGroupSidebarItemTrigger = ({
	activePage,
	model,
	tryNavigate,
}: AdminPageGroupSidebarItemTriggerProps) => {
	return (
		<AdminPageSidebarItemInternal
			activePage={activePage}
			extraContent={
				<Icon
					className="ml-auto transition-transform group-data-[state=open]/sidebar-menu:rotate-90 !w-3 !h-3 stroke-[2.5]"
					icon="chevron-right"
				/>
			}
			ItemComponent={CollapsibleSidebarMenuItem}
			model={model}
			tryNavigate={tryNavigate}
		/>
	);
};

interface AdminPageGroupSidebarItemProps {
	activePage: Page;
	model: AdminGroupPageModel;
	tryNavigate: AdminNavigateFunction;
}

const AdminPageGroupSidebarItem = ({ activePage, model, tryNavigate }: AdminPageGroupSidebarItemProps) => {
	return (
		<Collapsible className="group/sidebar-menu">
			<AdminPageGroupSidebarItemTrigger activePage={activePage} model={model} tryNavigate={tryNavigate} />
			<CollapsibleContent>
				<SidebarMenuSub className="border-none">
					{model.children.map((child) => (
						<AdminPageSidebarItemInternal
							activePage={activePage}
							ItemComponent={SidebarMenuSubItem}
							key={child.page}
							model={child}
							subButton
							tryNavigate={tryNavigate}
						/>
					))}
				</SidebarMenuSub>
			</CollapsibleContent>
		</Collapsible>
	);
};

interface AdminPageSidebarItemInternalProps {
	activePage: Page;
	model: AdminPageModel;
	tryNavigate: AdminNavigateFunction;
	ItemComponent: ComponentType<{ children: ReactNode }>;
	subButton?: boolean;
	extraContent?: ReactNode;
}

const AdminPageSidebarItemInternal = (props: AdminPageSidebarItemInternalProps) => {
	const { activePage, model, tryNavigate, ItemComponent, subButton, extraContent } = props;
	const isActive = activePage === model.page;
	const ButtonComponent = subButton ? AdminSidebarMenuSubButton : SidebarMenuButton;

	return (
		<ItemComponent>
			<ButtonComponent
				className="[&>svg]:hover:text-primary-fg"
				isActive={isActive}
				onClick={() => void tryNavigate(model.page)}
			>
				<Icon icon={model.icon} />
				<span>{getAdminPageTitle(model.page)}</span>
				{extraContent}
			</ButtonComponent>
		</ItemComponent>
	);
};
