import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import { ReactNode } from "react";

interface AddToFavoriteButtonProps {
	isFavorite: boolean;
	onClick: () => void;
	children?: ReactNode;
}

const AddToFavoriteButton = ({ isFavorite, onClick, children }: AddToFavoriteButtonProps) => {
	return (
		<CatalogItem
			renderLabel={(Item) => {
				return (
					<Item onSelect={onClick}>
						<Icon code={isFavorite ? "star-off" : "star"} />
						{isFavorite ? t("remove-favorite") : t("add-favorite")}
					</Item>
				);
			}}
		>
			{children}
		</CatalogItem>
	);
};

export default AddToFavoriteButton;
