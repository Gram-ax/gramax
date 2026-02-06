import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import t from "@ext/localization/locale/translate";
import { ReactNode } from "react";

interface NotesItemProps {
	children?: ReactNode;
}

const NotesItem = ({ children }: NotesItemProps) => {
	const { onToggleTab } = useCatalogActionsContext();

	return (
		<IsReadOnlyHOC>
			<CatalogItem
				renderLabel={(Item) => (
					<Item onSelect={() => onToggleTab(LeftNavigationTab.Inbox)}>
						<Icon code="inbox" />
						{t("inbox.notes")}
					</Item>
				)}
			>
				{children}
			</CatalogItem>
		</IsReadOnlyHOC>
	);
};

export default NotesItem;
