import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import t from "@ext/localization/locale/translate";
import type { ReactNode } from "react";

interface FragmentsItemProps {
	children?: ReactNode;
}

const FragmentsItem = ({ children }: FragmentsItemProps) => {
	const { onToggleTab } = useCatalogActionsContext();

	return (
		<CatalogItem
			renderLabel={(Item) => (
				<Item onSelect={() => onToggleTab(LeftNavigationTab.Fragments)}>
					<Icon code="square-dashed-bottom" />
					{t("fragments")}
				</Item>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default FragmentsItem;
