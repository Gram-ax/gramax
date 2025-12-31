import Icon from "@components/Atoms/Icon";
import ItemMenu from "@ext/item/EditMenu";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";
import { Button } from "@ui-kit/Button";
import React from "react";
import CreateArticle from "../../../../article/actions/CreateArticle";
import { ItemLink } from "../../../NavigationLinks";
import t from "@ext/localization/locale/translate";

interface RightExtensionsProps {
	item: ItemLink;
	isCategory: boolean;
	setThisItem: (item: ItemLink) => void;
	onMenuOpen?: () => void;
	onMenuClose?: () => void;
}

const RightExtensions: React.FC<RightExtensionsProps> = ({
	item,
	isCategory,
	setThisItem,
	onMenuOpen,
	onMenuClose,
}) => {
	return (
		<>
			<CreateArticle item={item} />
			<NavigationDropdown
				style={{ marginRight: "-4px" }}
				tooltipText={t("article.actions.title")}
				onOpen={onMenuOpen}
				onClose={onMenuClose}
				trigger={
					<Button variant="text" size="xs" className="p-0 h-full">
						<Icon code="ellipsis-vertical" />
					</Button>
				}
			>
				<ItemMenu itemLink={item} isCategory={isCategory} setItemLink={setThisItem} />
			</NavigationDropdown>
		</>
	);
};

export default RightExtensions;
