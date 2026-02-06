import Icon from "@components/Atoms/Icon";
import ItemMenu from "@ext/item/EditMenu";
import t from "@ext/localization/locale/translate";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";
import { Button } from "@ui-kit/Button";
import React from "react";
import CreateArticle from "../../../../article/actions/CreateArticle";
import { ItemLink } from "../../../NavigationLinks";

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
				onClose={onMenuClose}
				onOpen={onMenuOpen}
				style={{ marginRight: "-4px" }}
				tooltipText={t("article.actions.title")}
				trigger={
					<Button className="p-0 h-full" size="xs" variant="text">
						<Icon code="ellipsis-vertical" />
					</Button>
				}
			>
				<ItemMenu isCategory={isCategory} itemLink={item} setItemLink={setThisItem} />
			</NavigationDropdown>
		</>
	);
};

export default RightExtensions;
