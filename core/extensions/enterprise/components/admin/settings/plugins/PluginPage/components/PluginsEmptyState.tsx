import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { PageState, PageStateButtonGroup, PageStateDescription, PageStateTitle } from "@ui-kit/PageState";

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
					<Icon icon="plus" size="md" />
					{t("plugins.list.upload-button")}
				</Button>
			</PageStateButtonGroup>
		</PageState>
	);
};
