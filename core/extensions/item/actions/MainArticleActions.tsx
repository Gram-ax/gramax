import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import ArticleMoveAction from "@ext/article/actions/move/ArticleMoveAction";
import AddToFavoriteButton from "@ext/article/Favorite/components/AddToFavoriteButton";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import PropsEditorTrigger from "@ext/item/actions/propsEditor/components/PropsEditorTrigger";
import TemplateItemList from "@ext/templates/components/TemplateItemList";
import { useCallback } from "react";
import { ItemLink } from "../../navigation/NavigationLinks";

interface MainArticleActionsProps {
	hasError: boolean;
	itemProps: ClientArticleProps;
	itemLink: ItemLink;
	isCategory: boolean;
	isCurrentItem: boolean;
	catalogName: string;
	setItemLink: (itemLink: ItemLink) => void;
	onUpdate: () => void;
}

export const MainArticleActionsProps = (props: MainArticleActionsProps) => {
	const { hasError, itemProps, itemLink, isCategory, isCurrentItem, catalogName, setItemLink, onUpdate } = props;
	const { isStatic, isStaticCli, isNext } = usePlatform();

	const { articles } = FavoriteService.value;
	const isFavorite = articles.some((article) => article === itemLink.ref.path);

	const updateFavorite = useCallback(() => {
		const newFavoriteArticles = isFavorite
			? articles.filter((article) => article !== itemLink.ref.path)
			: [...articles, itemLink.ref.path];

		FavoriteService.setArticles(newFavoriteArticles);
	}, [articles, itemLink.ref.path, isFavorite]);

	return (
		<>
			<IsReadOnlyHOC>
				{!hasError && (
					<>
						<PropsEditorTrigger
							isCategory={isCategory}
							isCurrentItem={isCurrentItem}
							item={itemProps}
							itemLink={itemLink}
							onUpdate={onUpdate}
							setItemLink={setItemLink}
						/>
						<TemplateItemList disabled={!isCurrentItem} itemRefPath={itemProps?.ref.path} />
					</>
				)}
			</IsReadOnlyHOC>
			{!isStatic && !isStaticCli && !itemProps?.errorCode && (
				<AddToFavoriteButton isFavorite={isFavorite} onClick={updateFavorite} />
			)}
			<IsReadOnlyHOC>
				{!isStatic && !isStaticCli && !isNext && (
					<ArticleMoveAction articlePath={itemProps?.ref?.path} catalogName={catalogName} />
				)}
			</IsReadOnlyHOC>
		</>
	);
};
