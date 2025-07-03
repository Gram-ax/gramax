import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import styled from "@emotion/styled";
import { TextSize } from "@components/Atoms/Button/Button";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import AddToFavoriteButton from "@ext/artilce/Favorite/components/AddToFavoriteButton";
import FavoriteProvider from "@ext/artilce/Favorite/logic/FavoriteProvider";
import Workspace from "@core-ui/ContextServices/Workspace";
import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import { usePlatform } from "@core-ui/hooks/usePlatform";

interface CardActionsProps {
	catalogLink: CatalogLink;
}

const Wrapper = styled.div`
	opacity: 0;
	position: absolute;
	right: 0;
	bottom: 0;
	z-index: var(--z-index-homepage-action);
	margin: 0 0 0.5rem 0.5rem;
	transition: opacity var(--transition-time);

	&:has(div:first-of-type[aria-expanded="true"]) {
		opacity: 1;
	}
`;

const CardActions = ({ catalogLink }: CardActionsProps) => {
	const { isStatic, isStaticCli } = usePlatform();
	if (isStatic || isStaticCli) return null;

	const workspace = Workspace.current();
	const { catalogs } = FavoriteService.value;
	const [isOpen, setIsOpen] = useState(false);
	const isFavorite = catalogs.some((catalog) => catalog === catalogLink.name);

	const handleOpen = () => {
		setIsOpen(true);
	};

	const handleClose = () => {
		setIsOpen(false);
	};

	const onClickFavorite = () => {
		const favoriteProvider = new FavoriteProvider(workspace.name);
		let newCatalogs = [...catalogs];
		if (catalogLink.isFavorite) {
			newCatalogs = newCatalogs.filter((catalog) => catalog !== catalogLink.name);
		} else {
			newCatalogs.push(catalogLink.name);
		}

		setIsOpen(false);
		FavoriteService.setCatalogs(newCatalogs);
		favoriteProvider.setFavoriteCatalogNames(newCatalogs);
	};

	return (
		<Wrapper className="card-actions">
			<PopupMenuLayout
				isOpen={isOpen}
				hideOnClick={false}
				appendTo={() => document.body}
				onClose={handleClose}
				trigger={
					<Tooltip content={t("actions")}>
						<ButtonLink iconCode="ellipsis-vertical" onClick={handleOpen} textSize={TextSize.M} />
					</Tooltip>
				}
			>
				{isOpen && (
					<>
						<AddToFavoriteButton isFavorite={isFavorite} onClick={onClickFavorite} />
					</>
				)}
			</PopupMenuLayout>
		</Wrapper>
	);
};

export default CardActions;
