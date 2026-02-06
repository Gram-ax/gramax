import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { Plus } from "lucide-react";

interface PluginsHeaderProps {
	isRefreshing: boolean;
	onAddClick: () => void;
	selectedCount: number;
	loading: boolean;
	onDeleteSelected: () => void;
}

export const PluginsHeader = ({
	isRefreshing,
	onAddClick,
	selectedCount,
	loading,
	onDeleteSelected,
}: PluginsHeaderProps) => {
	return (
		<StickyHeader
			actions={
				<>
					{selectedCount > 0 && (
						<Button disabled={loading} onClick={onDeleteSelected} variant="outline">
							<Icon icon={loading ? "loader" : "trash"} />
							{loading ? `${t("deleting")}...` : `${t("delete")} (${selectedCount})`}
						</Button>
					)}
					<Button onClick={onAddClick}>
						<Plus size={16} />
						{t("plugins.list.add-button")}
					</Button>
				</>
			}
			title={
				<>
					{getAdminPageTitle(Page.PLUGINS)} <Spinner show={isRefreshing} size="small" />
				</>
			}
		/>
	);
};
