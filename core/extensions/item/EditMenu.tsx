import { TextSize } from "@components/Atoms/Button/Button";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import BugsnagTrigger from "@ext/bugsnag/components/BugsnagTrigger";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import ToolsArticleActions from "@ext/item/actions/ToolsArticleActions";
import { shouldShowActionWarning } from "@ext/localization/actions/OtherLanguagesPresentWarning";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { DropdownMenuLabel, DropdownMenuSeparator } from "@ui-kit/Dropdown";
import React, { CSSProperties, Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { ItemLink } from "../navigation/NavigationLinks";
import DeleteItem from "./actions/DeleteItem";
import { ExportIntegrationArticleActions } from "./actions/ExportIntegrationArticleActions";
import { LinksArticleActions } from "./actions/LinksArticleActions";
import { MainArticleActionsProps } from "./actions/MainArticleActions";

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
	const hasError = !!articleProps?.errorCode;
	const router = useRouter();
	const [itemProps, setItemProps] = useState<ClientArticleProps>(null);
	const isCurrentItem = articleProps?.ref?.path == itemLink?.ref?.path;

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

	const onUpdate = useCallback(() => {
		setItemPropsData(itemLink.ref.path);
	}, [itemLink.ref.path, setItemPropsData]);

	return (
		<>
			<DropdownMenuLabel className="text-primary-fg">{t("article.actions.title")}</DropdownMenuLabel>
			<DropdownMenuSeparator />
			<MainArticleActionsProps
				catalogName={catalogName}
				hasError={hasError}
				isCategory={isCategory}
				isCurrentItem={isCurrentItem}
				itemLink={itemLink}
				itemProps={itemProps}
				onUpdate={onUpdate}
				setItemLink={setItemLink}
			/>
			<DropdownMenuSeparator />
			<IsReadOnlyHOC>
				<LinksArticleActions itemLink={itemLink} />
				<DropdownMenuSeparator />
			</IsReadOnlyHOC>
			<ToolsArticleActions
				isCurrentItem={isCurrentItem}
				isTemplate={articleProps?.template?.length > 0}
				item={itemProps}
			/>
			<IsReadOnlyHOC>
				<DropdownMenuSeparator />
			</IsReadOnlyHOC>
			<ExportIntegrationArticleActions
				hasError={hasError}
				isCategory={isCategory}
				item={itemProps}
				itemLink={itemLink}
			/>
			<IsReadOnlyHOC>
				<DropdownMenuSeparator />
				<BugsnagTrigger itemLogicPath={itemLink.ref.path} />
				<DropdownMenuSeparator />
				<DeleteItem onConfirm={onClickHandler} />
			</IsReadOnlyHOC>
		</>
	);
});

export default EditMenu;
