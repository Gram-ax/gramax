import Icon from "@components/Atoms/Icon";
import Workspace from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import FavoriteProvider from "@ext/artilce/Favorite/logic/FavoriteProvider";
import t from "@ext/localization/locale/translate";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { CardMenuTrigger } from "ics-ui-kit/components/card";

interface CardActionsProps {
	catalogLink: CatalogLink;
}

const CardActions = ({ catalogLink }: CardActionsProps) => {
	const { isStatic, isStaticCli } = usePlatform();
	if (isStatic || isStaticCli) return null;

	const workspace = Workspace.current();
	const { catalogs } = FavoriteService.value;
	const isFavorite = catalogs.some((catalog) => catalog === catalogLink.name);

	const onClickFavorite = () => {
		const favoriteProvider = new FavoriteProvider(workspace.path);
		let newCatalogs = [...catalogs];
		if (favoriteProvider.isFavoriteCatalog(catalogLink.name)) {
			newCatalogs = newCatalogs.filter((catalog) => catalog !== catalogLink.name);
		} else {
			newCatalogs.push(catalogLink.name);
		}

		FavoriteService.setCatalogs(newCatalogs);
		favoriteProvider.setFavoriteCatalogNames(newCatalogs);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
				<CardMenuTrigger />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuItem
					onClick={(e) => {
						e.stopPropagation();
						onClickFavorite();
					}}
				>
					<Icon code={isFavorite ? "star-off" : "star"} />
					{isFavorite ? t("remove-favorite") : t("add-favorite")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default CardActions;
