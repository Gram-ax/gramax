import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { PageState, PageStateButtonGroup, PageStateDescription, PageStateTitle } from "@ui-kit/PageState";
import { Plus } from "lucide-react";

interface PluginsEmptyStateProps {
	onUploadClick: () => void;
}

export const PluginsEmptyState = ({ onUploadClick }: PluginsEmptyStateProps) => {
	return (
		<PageState>
			<PageStateTitle>{t("plugins.list.no-plugins-title")}</PageStateTitle>
			<PageStateDescription>{t("plugins.list.no-plugins-description")}</PageStateDescription>
			<PageStateButtonGroup>
				<Button onClick={onUploadClick}>
					<Plus size={16} />
					{t("plugins.list.upload-button")}
				</Button>
			</PageStateButtonGroup>
		</PageState>
	);
};
