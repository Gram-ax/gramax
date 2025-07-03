import t from "@ext/localization/locale/translate";
import ButtonLink from "@components/Molecules/ButtonLink";

interface AddToFavoriteButtonProps {
	isFavorite: boolean;
	onClick: () => void;
}

const AddToFavoriteButton = ({ isFavorite, onClick }: AddToFavoriteButtonProps) => {
	return (
		<ButtonLink
			iconCode={isFavorite ? "star-off" : "star"}
			text={isFavorite ? t("remove-favorite") : t("add-favorite")}
			onClick={onClick}
		/>
	);
};

export default AddToFavoriteButton;
