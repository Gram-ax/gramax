import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { ItemLink } from "../../navigation/NavigationLinks";
import TemplateItemList from "@ext/templates/components/TemplateItemList";
import PropsEditorTrigger from "@ext/item/actions/propsEditor/components/PropsEditorTrigger";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import { useCallback } from "react";
import AddToFavoriteButton from "@ext/article/Favorite/components/AddToFavoriteButton";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import ArticleMoveAction from "@ext/article/actions/move/ArticleMoveAction";

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
							item={itemProps}
							itemLink={itemLink}
							isCategory={isCategory}
							isCurrentItem={isCurrentItem}
							setItemLink={setItemLink}
							onUpdate={onUpdate}
						/>
						<TemplateItemList itemRefPath={itemProps?.ref.path} disabled={!isCurrentItem} />
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
