import ArticleActions from "@components/Actions/ArticleActions";
import ExportToDocxOrPdf from "@components/Actions/ExportToDocxOrPdf";
import { TextSize } from "@components/Atoms/Button/Button";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ArticleMoveAction from "@ext/article/actions/move/ArticleMoveAction";
import AddToFavoriteButton from "@ext/article/Favorite/components/AddToFavoriteButton";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import PropsEditor from "@ext/item/actions/propsEditor/components/PropsEditorTrigger";
import { shouldShowActionWarning } from "@ext/localization/actions/OtherLanguagesPresentWarning";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import TemplateItemList from "@ext/templates/components/TemplateItemList";
import React, { CSSProperties, Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { ItemLink } from "../navigation/NavigationLinks";
import DeleteItem from "./actions/DeleteItem";

interface EditMenuProps {
	itemLink: ItemLink;
	isCategory: boolean;
	setItemLink: Dispatch<SetStateAction<ItemLink>>;
	textSize?: TextSize;
	style?: CSSProperties;
	onOpen?: () => void;
	onClose?: () => void;
}

const EditMenu = React.memo(({ itemLink, isCategory, setItemLink }: EditMenuProps) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;
	const { catalogName, supportedLanguagesLength } = useCatalogPropsStore((state) => ({
		catalogName: state.data?.name,
		supportedLanguagesLength: state.data?.supportedLanguages?.length,
	}));
	const isCatalogExist = !!catalogName;
	const hasError = articleProps?.errorCode;
	const router = useRouter();
	const [itemProps, setItemProps] = useState<ClientArticleProps>(null);
	const isCurrentItem = articleProps?.ref?.path == itemLink?.ref?.path;
	const { articles } = FavoriteService.value;
	const isFavorite = articles.some((article) => article === itemLink.ref.path);

	const { isStatic, isStaticCli, isNext } = usePlatform();

	useEffect(() => {
		if (!isCurrentItem) return;
		const fetchItemProps = async () => {
			const response = await FetchService.fetch(apiUrlCreator.getItemProps(articleProps.ref.path));
			if (!response.ok) return;
			const data = (await response.json()) as ClientArticleProps;
			setItemProps(data);
		};

		void fetchItemProps();
	}, [articleProps?.ref?.path, isCurrentItem]);

	const setItemPropsData = useCallback(
		async (path: string) => {
			const response = await FetchService.fetch(apiUrlCreator.getItemProps(path));
			if (!response.ok) return;
			const data = (await response.json()) as ClientArticleProps;
			setItemProps(data);
		},
		[apiUrlCreator],
	);

	const onClickHandler = async () => {
		const deleteConfirmText = t(isCategory ? "confirm-category-delete" : "confirm-article-delete");
		if (!shouldShowActionWarning(supportedLanguagesLength) && !(await confirm(deleteConfirmText))) return;

		ErrorConfirmService.stop();
		await FetchService.fetch(apiUrlCreator.removeItem(itemLink.ref.path));
		ErrorConfirmService.start();

		const mutable = { preventGoto: false };
		await NavigationEvents.emit("item-delete", { path: itemLink.pathname, mutable });
		if (mutable.preventGoto) return;

		const currentPathname = RouterPathProvider.getLogicPath(router.path);
		const itemPathname = RouterPathProvider.getLogicPath(itemLink.pathname);

		if (currentPathname == itemPathname) router.pushPath(new Path(currentPathname).parentDirectoryPath.value);
		else refreshPage();
	};

	useWatch(() => {
		if (!isCurrentItem && !itemProps) setItemPropsData(itemLink.ref.path);
	}, [isCurrentItem, isReadOnly, itemLink?.ref?.path]);

	const updateFavorite = useCallback(() => {
		const newFavoriteArticles = isFavorite
			? articles.filter((article) => article !== itemLink.ref.path)
			: [...articles, itemLink.ref.path];

		FavoriteService.setArticles(newFavoriteArticles);
	}, [articles, itemLink.ref.path, isFavorite]);

	const onUpdate = useCallback(() => {
		setItemPropsData(itemLink.ref.path);
	}, [itemLink.ref.path, setItemPropsData]);

	return (
		<>
			{!isReadOnly ? (
				<>
					{!hasError && (
						<PropsEditor
							item={itemProps}
							itemLink={itemLink}
							isCategory={isCategory}
							isCurrentItem={isCurrentItem}
							setItemLink={setItemLink}
							onUpdate={onUpdate}
						/>
					)}
					<ArticleActions
						editLink={itemLink?.pathname}
						item={itemProps}
						isCatalogExist={isCatalogExist}
						isCurrentItem={isCurrentItem}
						isTemplate={articleProps?.template?.length > 0}
					/>
					<AddToFavoriteButton isFavorite={isFavorite} onClick={updateFavorite} />
					{!hasError && (
						<>
							{!isStatic && !isStaticCli && !isNext && (
								<ArticleMoveAction articlePath={itemProps?.ref?.path} catalogName={catalogName} />
							)}
							<ExportToDocxOrPdf
								isCategory={isCategory}
								fileName={itemProps?.fileName}
								itemRefPath={itemProps?.ref?.path}
							/>
							{isCurrentItem && <TemplateItemList itemRefPath={itemProps?.ref.path} />}
						</>
					)}
					<DeleteItem onConfirm={onClickHandler} />
				</>
			) : (
				<>
					{!isStatic && !isStaticCli && (
						<AddToFavoriteButton isFavorite={isFavorite} onClick={updateFavorite} />
					)}
					{!hasError && (
						<ExportToDocxOrPdf
							isCategory={isCategory}
							fileName={itemProps?.fileName}
							itemRefPath={itemProps?.ref?.path}
						/>
					)}
				</>
			)}
		</>
	);
});

export default EditMenu;
