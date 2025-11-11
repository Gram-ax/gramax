import t from "@ext/localization/locale/translate";
import Icon from "@components/Atoms/Icon";
import { DropdownMenuItem } from "@ui-kit/Dropdown";

interface AddToFavoriteButtonProps {
	isFavorite: boolean;
	onClick: () => void;
}

const AddToFavoriteButton = ({ isFavorite, onClick }: AddToFavoriteButtonProps) => {
	return (
		<DropdownMenuItem onSelect={onClick}>
			<Icon code={isFavorite ? "star-off" : "star"} />
			{isFavorite ? t("remove-favorite") : t("add-favorite")}
		</DropdownMenuItem>
	);
};

export default AddToFavoriteButton;
