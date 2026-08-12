import type { AdminNavigateFunction } from "@ext/enterprise/components/admin/hooks/useAdminPage";
import { useSidebarGroupOpen } from "@ext/enterprise/components/admin/hooks/useSidebarGroupOpen";
import { AdminSidebarMenuSubButton } from "@ext/enterprise/components/admin/sidebar/AdminSidebarMenuSubButton";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import {
	type AdminGroupPageDescriptor,
	type AdminPageDescriptor,
	getGroupTargetPage,
} from "@ext/enterprise/model/AdminPageModel";
import type { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Icon } from "@ui-kit/Icon";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "@ui-kit/Sidebar";
import type { ComponentType, ReactNode } from "react";

export interface AdminPageSidebarItemProps {
	activePage: Page;
	model: AdminPageDescriptor;
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
	model: AdminGroupPageDescriptor;
	tryNavigate: AdminNavigateFunction;
	onItemClick: () => void;
}

export const AdminPageGroupSidebarItemTrigger = (props: AdminPageGroupSidebarItemTriggerProps) => {
	const { activePage, model, tryNavigate, onItemClick } = props;
	const isActive = activePage === model.page;
	const targetPage = getGroupTargetPage(model);
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				className="[&>svg]:hover:text-primary-fg"
				isActive={isActive}
				onClick={() => {
					onItemClick();
					void tryNavigate(targetPage);
				}}
			>
				<Icon icon={model.icon} />
				<span>{getAdminPageTitle(model.page)}</span>
				<CollapsibleTrigger asChild>
					<Button
						aria-label="Toggle section"
						className="size-3.5 p-0"
						onClick={(e) => e.stopPropagation()}
						size="sm"
						variant="text"
					>
						<Icon
							className="!w-3 !h-3 stroke-[2.5] transition-transform group-data-[state=open]/sidebar-menu:rotate-90"
							icon="chevron-right"
						/>
					</Button>
				</CollapsibleTrigger>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
};

interface AdminPageGroupSidebarItemProps {
	activePage: Page;
	model: AdminGroupPageDescriptor;
	tryNavigate: AdminNavigateFunction;
}

const AdminPageGroupSidebarItem = ({ activePage, model, tryNavigate }: AdminPageGroupSidebarItemProps) => {
	const containsActivePage = activePage === model.page || model.children.some((child) => child.page === activePage);
	const { open, setOpen, onItemClick } = useSidebarGroupOpen(
		containsActivePage,
		activePage === getGroupTargetPage(model),
	);
	return (
		<Collapsible className="group/sidebar-menu" onOpenChange={setOpen} open={open}>
			<AdminPageGroupSidebarItemTrigger
				activePage={activePage}
				model={model}
				onItemClick={onItemClick}
				tryNavigate={tryNavigate}
			/>
			<CollapsibleContent className="overflow-visible data-[state=closed]:overflow-hidden">
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
	model: AdminPageDescriptor;
	tryNavigate: AdminNavigateFunction;
	ItemComponent: ComponentType<{ children: ReactNode }>;
	subButton?: boolean;
}

const AdminPageSidebarItemInternal = (props: AdminPageSidebarItemInternalProps) => {
	const { activePage, model, tryNavigate, ItemComponent, subButton } = props;
	const isActive = activePage === model.page;
	const ButtonComponent = subButton ? AdminSidebarMenuSubButton : SidebarMenuButton;
	const targetPage = model.type === "group" && model.defaultChildPage ? model.defaultChildPage : model.page;

	return (
		<ItemComponent>
			<ButtonComponent
				className="[&>svg]:hover:text-primary-fg"
				isActive={isActive}
				onClick={() => void tryNavigate(targetPage)}
			>
				<Icon icon={model.icon} />
				<span>{getAdminPageTitle(model.page)}</span>
			</ButtonComponent>
		</ItemComponent>
	);
};
