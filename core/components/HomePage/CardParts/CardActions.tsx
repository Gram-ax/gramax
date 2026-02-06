import Icon from "@components/Atoms/Icon";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Workspace from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import FavoriteProvider from "@ext/article/Favorite/logic/FavoriteProvider";
import CatalogMoveAction from "@ext/catalog/actions/move/components/CatalogMoveAction";
import SelectTargetWorkspace from "@ext/catalog/actions/move/components/SelectTargetWorkspace";
import { useDeleteCatalog } from "@ext/catalog/actions/propsEditor/components/useDeleteCatalog";
import t from "@ext/localization/locale/translate";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { CardMenuTrigger } from "@ui-kit/Card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { useCallback } from "react";

interface CardActionsProps {
	catalogLink: CatalogLink;
}

const CardActions = ({ catalogLink }: CardActionsProps) => {
	const { isStatic, isStaticCli } = usePlatform();
	if (isStatic || isStaticCli) return null;

	const workspace = Workspace.current();
	const { catalogs } = FavoriteService.value;
	const isFavorite = catalogs.some((catalog) => catalog === catalogLink.name);

	const toggleFavorite = useCallback(() => {
		const favoriteProvider = new FavoriteProvider(workspace.path);
		let newCatalogs = [...catalogs];
		if (favoriteProvider.isFavoriteCatalog(catalogLink.name)) {
			newCatalogs = newCatalogs.filter((catalog) => catalog !== catalogLink.name);
		} else {
			newCatalogs.push(catalogLink.name);
		}

		FavoriteService.setCatalogs(newCatalogs);
		favoriteProvider.setFavoriteCatalogNames(newCatalogs);
	}, [catalogs, catalogLink, workspace]);

	const isLogged = PageDataContextService.value.isLogged;

	const deleteCatalog = useDeleteCatalog({ name: catalogLink.name });

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
				<CardMenuTrigger />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuItem
					onClick={(e) => {
						e.stopPropagation();
						toggleFavorite();
					}}
				>
					<Icon code={isFavorite ? "star-off" : "star"} />
					{isFavorite ? t("remove-favorite") : t("add-favorite")}
				</DropdownMenuItem>
				{isLogged && (
					<>
						<CatalogMoveAction catalogName={catalogLink.name}>
							{({ targetWorkspaceRef, checkAndMove }) => (
								<SelectTargetWorkspace
									excludeCurrent
									onClick={(workspace) => {
										targetWorkspaceRef.current = workspace;
										checkAndMove({
											url: (api) => api.getCatalogNameAfterMove(catalogLink.name, workspace.path),
										});
									}}
								/>
							)}
						</CatalogMoveAction>
						<DropdownMenuItem
							onClick={async (e) => {
								e.stopPropagation();
								if (!(await confirm(t("catalog.delete.name") + "?"))) return;
								await deleteCatalog();
							}}
							type="danger"
						>
							<Icon code="trash" />
							{t("catalog.delete.name")}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default CardActions;
