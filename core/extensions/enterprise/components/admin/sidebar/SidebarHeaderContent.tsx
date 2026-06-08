import t from "@ext/localization/locale/translate";
import { DialogTitle } from "@ui-kit/Dialog";
import { FeatureIcon } from "@ui-kit/Icon";
import { SidebarHeader } from "@ui-kit/Sidebar";
import { OverflowTooltip } from "@ui-kit/Tooltip";

export const AdminSidebarHeader = () => {
	return (
		<DialogTitle asChild className="-font-sans">
			<SidebarHeader className="px-4 py-3 h-[3.75rem] items-center flex-row">
				<FeatureIcon className="flex-shrink-0" icon="settings" size="sm" />
				<OverflowTooltip className="inline-block max-w-full truncate text-base font-medium">
					{t("enterprise.admin.settings-title")}
				</OverflowTooltip>
			</SidebarHeader>
		</DialogTitle>
	);
};
