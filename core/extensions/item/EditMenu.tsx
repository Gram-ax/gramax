import ArticleActions from "@components/Actions/ArticleActions";
import ExportToDocxOrPdf from "@components/Actions/ExportToDocxOrPdf";
import { TextSize } from "@components/Atoms/Button/Button";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import AddToFavoriteButton from "@ext/artilce/Favorite/components/AddToFavoriteButton";
import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import PropsEditor from "@ext/item/actions/propsEditor/components/PropsEditor";
import { shouldShowActionWarning } from "@ext/localization/actions/OtherLanguagesPresentWarning";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import TemplateItemList from "@ext/templates/components/TemplateItemList";
import React, { CSSProperties, Dispatch, SetStateAction, useEffect, useState } from "react";
import { ItemLink } from "../navigation/NavigationLinks";
import DeleteItem from "./actions/DeleteItem";

const StyledDiv = styled.div`
	display: flex;
	align-items: center;
	margin-right: -4px;

	span {
		display: flex;
		align-items: center;
	}
`;

interface EditMenuProps {
	itemLink: ItemLink;
	isCategory: boolean;
	setItemLink: Dispatch<SetStateAction<ItemLink>>;
	textSize?: TextSize;
	style?: CSSProperties;
	onOpen?: () => void;
	onClose?: () => void;
}

const ItemMenu = React.memo(({ itemLink, isCategory, setItemLink }: EditMenuProps) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const isCatalogExist = !!catalogProps.name;
	const hasError = articleProps?.errorCode;
	const router = useRouter();
	const [brotherFileNames, setBrotherFileName] = useState<string[]>(null);
	const [itemProps, setItemProps] = useState<ClientArticleProps>(null);
	const [isCurrentItem, setIsCurrentItem] = useState(articleProps?.ref?.path == itemLink?.ref?.path);
	const { articles } = FavoriteService.value;
	const isFavorite = articles.some((article) => article === itemLink.ref.path);

	const { isStatic, isStaticCli } = usePlatform();

	useEffect(() => {
		setIsCurrentItem(articleProps?.ref?.path == itemLink?.ref?.path);
	}, [articleProps?.ref?.path]);

	useEffect(() => {
		if (isCurrentItem) setItemProps(articleProps);
	}, [articleProps, isCurrentItem]);

	const setItemPropsData = async (path: string) => {
		const response = await FetchService.fetch(apiUrlCreator.getItemProps(path));
		if (!response.ok) return;
		const data = (await response.json()) as ClientArticleProps;
		setItemProps(data);
	};

	const setBrotherFileNamesData = async (path: string) => {
		const response = await FetchService.fetch(apiUrlCreator.getArticleBrotherFileNames(path));
		if (!response.ok) return;
		const data = (await response.json()) as string[];
		setBrotherFileName(data);
	};

	const onClickHandler = async () => {
		const deleteConfirmText = t(isCategory ? "confirm-category-delete" : "confirm-article-delete");
		if (!shouldShowActionWarning(catalogProps) && !(await confirm(deleteConfirmText))) return;

		ErrorConfirmService.stop();
		await FetchService.fetch(apiUrlCreator.removeItem(itemLink.ref.path));
		ErrorConfirmService.start();

		await NavigationEvents.emit("item-delete", { path: itemLink.ref.path });

		const currentPathname = RouterPathProvider.getLogicPath(router.path);
		const itemPathname = RouterPathProvider.getLogicPath(itemLink.pathname);

		if (currentPathname == itemPathname) {
			router.pushPath(new Path(currentPathname).parentDirectoryPath.value);
		} else {
			refreshPage();
		}
	};

	useEffect(() => {
		if (!isCurrentItem && !itemProps) setItemPropsData(itemLink.ref.path);
		if (!isReadOnly && !brotherFileNames) setBrotherFileNamesData(itemLink.ref.path);
	}, [isCurrentItem, isReadOnly, itemLink?.ref?.path, brotherFileNames, itemProps]);

	const updateFavorite = () => {
		const newFavoriteArticles = isFavorite
			? articles.filter((article) => article !== itemLink.ref.path)
			: [...articles, itemLink.ref.path];

		FavoriteService.setArticles(newFavoriteArticles);
	};

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
							brotherFileNames={brotherFileNames}
							setItemLink={setItemLink}
						/>
					)}
					<ArticleActions
						editLink={itemLink?.pathname}
						item={itemProps}
						isCatalogExist={isCatalogExist}
						isCurrentItem={isCurrentItem}
						isTemplate={false}
					/>
					<AddToFavoriteButton isFavorite={isFavorite} onClick={updateFavorite} />
					{!hasError && (
						<>
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

const EditMenu = ({ itemLink, isCategory, setItemLink, textSize, style, onOpen, onClose }: EditMenuProps) => {
	const [isClicked, setIsClicked] = useState(false);

	useEffect(() => {
		setIsClicked(false);
	}, [itemLink]);

	return (
		<StyledDiv
			onClick={(e) => {
				e.stopPropagation();
				setIsClicked(true);
			}}
		>
			<PopupMenuLayout
				isInline
				trigger={<ButtonLink textSize={textSize} style={style} iconCode="ellipsis-vertical" />}
				offset={[0, 10]}
				tooltipText={t("actions")}
				onOpen={onOpen}
				onClose={onClose}
				appendTo={() => document.body}
				resetMaxHeight
			>
				{isClicked && <ItemMenu itemLink={itemLink} isCategory={isCategory} setItemLink={setItemLink} />}
			</PopupMenuLayout>
		</StyledDiv>
	);
};

export default EditMenu;
