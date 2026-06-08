import { AdminHeaderProvider } from "@ext/enterprise/components/admin/contexts/AdminHeaderContext";
import type { PluginDetailParams } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { ScrollContainerProvider } from "@ext/enterprise/components/admin/contexts/ScrollContainerContext";
import { useWorkspaceEditorOptions } from "@ext/enterprise/components/admin/hooks/useWorkspaceEditorOptions";
import { PageRenderer } from "@ext/enterprise/components/admin/modal/PageRenderer";
import { AdminPageSidebarItem } from "@ext/enterprise/components/admin/sidebar/AdminPageSidebarItem";
import { PluginsSidebarMenu } from "@ext/enterprise/components/admin/sidebar/PluginsSidebarMenu";
import { AdminSidebarHeader } from "@ext/enterprise/components/admin/sidebar/SidebarHeaderContent";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { adminPageModelsArr } from "@ext/enterprise/model/AdminPageModel";
import type { Page } from "@ext/enterprise/types/Page";
import t from "@ext/localization/locale/translate";
import { Alert, AlertDescription } from "@ui-kit/Alert";
import { IconButton } from "@ui-kit/Button";
import { DialogClose } from "@ui-kit/Dialog";
import { Divider } from "@ui-kit/Divider";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from "@ui-kit/Sidebar";
import { type MutableRefObject, useEffect, useRef } from "react";

const WorkspaceEditorErrorMessage = () => {
	return (
		<div className="flex items-center justify-center h-screen">
			<div className="w-full max-w-md">
				<Alert focus="medium" status="error">
					<AlertDescription>{t("enterprise.admin.error.loading-settings")}</AlertDescription>
				</Alert>
			</div>
		</div>
	);
};

const WorkspaceEditorLoading = () => {
	return (
		<div className="flex items-center justify-center h-screen">
			<Spinner size="xl" />
		</div>
	);
};

export function MainContent() {
	useEffect(() => {
		const url = new URL(window.location.href);
		url.search = "";
		window.history.replaceState(null, "", url.toString());
	}, []);

	const { settings, error, scrollContainerRef, page, pageParams, tryNavigate } = useWorkspaceEditorOptions();

	if (error) {
		return <WorkspaceEditorErrorMessage />;
	}

	if (!settings) {
		return <WorkspaceEditorLoading />;
	}

	return (
		// The MainContentBodyHeader is sticky with a z-index and overlaps the sidebar, specifically the SidebarRail
		//   and we can't click on the rail.
		// Increasing z-index of the sidebar
		//   Sidebar creates a div wrapper inside, so we use ":first-child" on SidebarProvider
		// --sidebar-width so title in russian fits
		<SidebarProvider className="[&>:first-child]:z-[20] min-h-0 h-full overflow-hidden ![--sidebar-width:17.25rem] [&_ul]:list-none [&_li]:line-height-[unset] [&_li]:mb-0">
			<Sidebar collapsible="offcanvas">
				<AdminSidebarHeader />
				<Divider />
				<SidebarContent className="min-h-0 p-4 [&_ul]:list-none">
					<SidebarGroup className="p-0 font-normal">
						<SidebarGroupContent>
							<SidebarMenu>
								{adminPageModelsArr.map((model) => (
									<AdminPageSidebarItem
										activePage={page}
										key={model.page}
										model={model}
										tryNavigate={tryNavigate}
									/>
								))}
								<PluginsSidebarMenu
									activePage={page}
									pageParams={pageParams as PluginDetailParams}
									settings={settings}
									tryNavigate={tryNavigate}
								/>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarSeparator />
				<SidebarRail />
			</Sidebar>
			<MainContentBody page={page} scrollContainerRef={scrollContainerRef} />
		</SidebarProvider>
	);
}

interface MainContentBodyProps {
	page: Page;
	scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

const MainContentBody = (props: MainContentBodyProps) => {
	const { page, scrollContainerRef } = props;
	const headerRef = useRef<HTMLElement>();
	return (
		<main className="flex flex-col w-full max-w-full overflow-y-auto" ref={scrollContainerRef}>
			<AdminHeaderProvider value={{ headerRef }}>
				<MainContentBodyHeader headerRef={headerRef} />
				<div className="flex-1 p-6">
					<ScrollContainerProvider container={scrollContainerRef.current}>
						<PageRenderer page={page} />
					</ScrollContainerProvider>
				</div>
			</AdminHeaderProvider>
		</main>
	);
};

interface MainContentBodyHeaderProps {
	headerRef: MutableRefObject<HTMLElement>;
}

const MainContentBodyHeader = (props: MainContentBodyHeaderProps) => {
	const { headerRef } = props;
	return (
		// ml-[1px] is to fix the overlap of sidebar border
		//   because backdrop-blur touches border and feels like 1 pixel cut off
		<div className="sticky shrink-0 top-0 z-[15] h-[3.75rem] pl-4 pt-3 pb-2 pr-3 backdrop-blur-[0.875rem] ml-[1px]">
			<div className="flex items-center gap-4 h-full">
				<SidebarTrigger aria-label="Open sidebar" className="-mr-2 p-1.5 h-[unset]" />
				<Divider className="h-5" orientation="vertical" />
				<div className="flex-1 min-w-0" ref={headerRef as MutableRefObject<HTMLDivElement>}></div>
				<DialogClose asChild>
					<IconButton className="p-2.5 -ml-1" icon="X" variant="link" />
				</DialogClose>
			</div>
		</div>
	);
};
