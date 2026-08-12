import { cn } from "@core-ui/utils/cn";
import { AdminHeaderProvider } from "@ext/enterprise/components/admin/contexts/AdminHeaderContext";
import type { PluginDetailParams } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { ScrollContainerProvider } from "@ext/enterprise/components/admin/contexts/ScrollContainerContext";
import { useAdminPage } from "@ext/enterprise/components/admin/hooks/useAdminPage";
import { AdminHeaderOutlet } from "@ext/enterprise/components/admin/modal/AdminHeaderOutlet";
import { PageRenderer } from "@ext/enterprise/components/admin/modal/PageRenderer";
import { AdminPageSidebarItem } from "@ext/enterprise/components/admin/sidebar/AdminPageSidebarItem";
import { PluginsSidebarMenu } from "@ext/enterprise/components/admin/sidebar/PluginsSidebarMenu";
import { AdminSidebarHeader } from "@ext/enterprise/components/admin/sidebar/SidebarHeaderContent";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import type { GesErrorCode } from "@ext/enterprise/errors/GesError";
import { adminPageDescriptors, sidebarPageDescriptors } from "@ext/enterprise/model/AdminPageModel";
import { Page } from "@ext/enterprise/types/Page";
import t from "@ext/localization/locale/translate";
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
	useSidebar,
} from "@ui-kit/Sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect } from "react";

export const MainContent = () => {
	useEffect(() => {
		const url = new URL(window.location.href);
		url.search = "";
		window.history.replaceState(null, "", url.toString());
	}, []);

	const { settings, globalError, retry, scrollContainerRef, page, pageParams, tryNavigate } = useAdminPage();

	// biome-ignore lint/correctness/useExhaustiveDependencies(tryNavigate): one time setup
	useEffect(() => {
		void tryNavigate(Page.WORKSPACE);
	}, []);

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
								{sidebarPageDescriptors.map((model) => (
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
			<MainContentBody
				globalError={globalError}
				onRetry={retry}
				page={page}
				scrollContainerRef={scrollContainerRef}
			/>
		</SidebarProvider>
	);
};

interface MainContentBodyProps {
	page: Page;
	scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
	globalError: GesErrorCode | null;
	onRetry: () => void;
}

const MainContentBody = (props: MainContentBodyProps) => {
	const { page, scrollContainerRef, globalError, onRetry } = props;
	const pageDescriptor = adminPageDescriptors[page];
	return (
		<main
			className={cn(
				"flex flex-col w-full max-w-full overflow-y-auto",
				pageDescriptor?.fullscreen && "h-full overflow-hidden",
			)}
			ref={scrollContainerRef}
		>
			<AdminHeaderProvider>
				<MainContentBodyHeader />
				<div className={cn("flex-1 p-6", pageDescriptor?.fullscreen && "min-h-0")}>
					{globalError ? (
						<TabErrorBlock code={globalError} onRetry={onRetry} />
					) : (
						<ScrollContainerProvider container={scrollContainerRef.current}>
							<PageRenderer page={page} />
						</ScrollContainerProvider>
					)}
				</div>
			</AdminHeaderProvider>
		</main>
	);
};

const MainContentBodyHeader = () => {
	const { state } = useSidebar();
	return (
		// ml-[1px] is to fix the overlap of sidebar border
		//   because backdrop-blur touches border and feels like 1 pixel cut off
		<div className="sticky shrink-0 top-0 z-[15] min-h-[3.75rem] pl-3.5 pt-3 pb-2 pr-3 backdrop-blur-[0.875rem] ml-[1px]">
			<div className="flex items-center gap-4 h-10">
				<Tooltip>
					<TooltipContent className="font-sans font-normal">
						<p>
							{state === "expanded"
								? t("enterprise.admin.hide-sidebar")
								: t("enterprise.admin.show-sidebar")}
						</p>
					</TooltipContent>
					<TooltipTrigger asChild>
						<SidebarTrigger
							aria-label="Open sidebar"
							className="-mr-2 h-[unset]"
							size="md"
							variant="text"
						/>
					</TooltipTrigger>
				</Tooltip>
				<Divider className="h-5" orientation="vertical" />
				<div className="flex-1 min-w-0">
					<AdminHeaderOutlet />
				</div>
				<DialogClose asChild>
					<IconButton className="p-2.5 -ml-1" icon="X" variant="link" />
				</DialogClose>
			</div>
		</div>
	);
};
