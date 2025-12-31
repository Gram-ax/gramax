import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import t from "@ext/localization/locale/translate";
import { ReactNode } from "react";

interface SnippetsItemProps {
	children?: ReactNode;
}

const SnippetsItem = ({ children }: SnippetsItemProps) => {
	const { onToggleTab } = useCatalogActionsContext();

	return (
		<CatalogItem
			renderLabel={(Item) => (
				<Item onSelect={() => onToggleTab(LeftNavigationTab.Snippets)}>
					<Icon code="file" />
					{t("snippets")}
				</Item>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default SnippetsItem;
