import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import t from "@ext/localization/locale/translate";
import { ReactNode } from "react";

interface TemplateItemProps {
	children?: ReactNode;
}

const TemplateItem = ({ children }: TemplateItemProps) => {
	const { onToggleTab } = useCatalogActionsContext();

	return (
		<CatalogItem
			renderLabel={(Item) => (
				<Item onSelect={() => onToggleTab(LeftNavigationTab.Template)}>
					<Icon code="layout-template" />
					{t("template.name")}
				</Item>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default TemplateItem;
