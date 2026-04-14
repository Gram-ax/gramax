import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import BugsnagTrigger from "@ext/bugsnag/components/BugsnagTrigger";
import { NotificationSettingsButton } from "@ext/enterprise/components/NotificationSettingsButton";
import { DeleteItemTrigger } from "@ext/item/actions/DeleteArticleTrigger";
import { SearchInScopeTrigger } from "@ext/item/actions/SearchInScopeTrigger";
import { ArticleEditMarkdownTrigger } from "@ext/item/actions/ToolsArticleActions";
import t from "@ext/localization/locale/translate";
import { DropdownMenuLabel, DropdownMenuSeparator } from "@ui-kit/Dropdown";
import React, { type Dispatch, type SetStateAction, useCallback, useState } from "react";
import type { Environment } from "../../../app/resolveModule/env";
import ExportToDocxOrPdf from "../../components/Actions/ExportToDocxOrPdf";
import ShowInExplorer from "../../components/Actions/ShowInExplorer";
import { usePlatform } from "../../ui-logic/hooks/usePlatform";
import ArticleMoveAction from "../article/actions/move/ArticleMoveAction";
import ShareAction from "../catalog/actions/share/components/ShareAction";
import { ArticleFavoriteSettingsButton } from "../enterprise/components/ArticleFavoriteSettingsButton";
import EnterpriseCheckStyleGuide from "../enterprise/components/EnterpriseCheckStyleGuide";
import HistoryTrigger from "../git/actions/History/component/HistoryTrigger";
import type { CategoryLink, ItemLink } from "../navigation/NavigationLinks";
import ArticleLinks from "../properties/components/Helpers/ArticleLinks";
import TemplateItemList from "../templates/components/TemplateItemList";
import PropsEditorTrigger from "./actions/propsEditor/components/PropsEditorTrigger";

interface EditMenuProps {
	itemLink: ItemLink;
	setItemLink: Dispatch<SetStateAction<ItemLink>>;
	onOpen?: () => void;
	onClose?: () => void;
}

const HeaderLabel: React.FC = () => (
	<DropdownMenuLabel className="text-primary-fg">{t("article.actions.title")}</DropdownMenuLabel>
);

const components: Record<Environment, (props: EditMenuProps) => React.ReactNode> = {
	browser: (props) => <AnyEditorEditMenu {...props} />,
	tauri: (props) => <AnyEditorEditMenu {...props} />,
	next: (props) => <ReadonlyEditMenu {...props} />,
	static: (props) => <StaticEditMenu {...props} />,
	cli: (props) => <StaticEditMenu {...props} />,
	docportal: (props) => <ReadonlyEditMenu {...props} />,
	test: () => null,
};

const EditMenu = React.memo((props: EditMenuProps) => {
	const { environment } = usePlatform();
	return components[environment](props);
});

export default EditMenu;

function useEditMenuItemProps(itemLink: ItemLink | CategoryLink) {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [itemProps, setItemProps] = useState<ClientArticleProps>(null);

	const setItemPropsData = useCallback(async () => {
		if (!itemLink.ref.path) return;
		const response = await FetchService.fetch(apiUrlCreator.getItemProps(itemLink.ref.path));
		if (!response.ok) return;
		const data = (await response.json()) as ClientArticleProps;
		setItemProps(data);
	}, [apiUrlCreator, itemLink.ref.path]);

	useWatch(() => {
		setItemPropsData();
	}, [itemLink?.ref?.path]);

	const isLinkToValidArticle = itemProps && !itemProps.errorCode;
	const isCategory = itemLink.type === ItemType.category && (itemLink as CategoryLink).items.length > 0;
	const isCurrentItem = itemProps?.ref.path === itemLink.ref.path;

	return { itemProps, setItemPropsData, isLinkToValidArticle, isCategory, isCurrentItem };
}

const ReadonlyEditMenu = ({ itemLink }: EditMenuProps) => {
	const { itemProps, isLinkToValidArticle, isCategory } = useEditMenuItemProps(itemLink);

	if (!isLinkToValidArticle) return null;

	return (
		<>
			<HeaderLabel />
			<DropdownMenuSeparator />
			<SearchInScopeTrigger isCategory={isCategory} itemLink={itemLink} />
			<ArticleFavoriteSettingsButton itemLinkPath={itemLink.ref.path} />
			<DropdownMenuSeparator />
			<ExportToDocxOrPdf fileName={itemProps.fileName} isCategory={isCategory} itemRefPath={itemLink.ref.path} />
		</>
	);
};

const StaticEditMenu = ({ itemLink }: EditMenuProps) => {
	const { itemProps, isCategory, isLinkToValidArticle } = useEditMenuItemProps(itemLink);

	if (!isLinkToValidArticle) return null;

	return (
		<>
			<HeaderLabel />
			<DropdownMenuSeparator />
			<SearchInScopeTrigger isCategory={isCategory} itemLink={itemLink} />
			<DropdownMenuSeparator />
			<ExportToDocxOrPdf fileName={itemProps.fileName} isCategory={isCategory} itemRefPath={itemLink.ref.path} />
		</>
	);
};

const AnyEditorEditMenu = (props: EditMenuProps) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	if (isReadOnly) return <ReadonlyEditMenu {...props} />;
	return <EditorEditMenu {...props} />;
};

const EditorEditMenu = ({ itemLink, setItemLink }: EditMenuProps) => {
	const { itemProps, setItemPropsData, isCategory, isLinkToValidArticle, isCurrentItem } =
		useEditMenuItemProps(itemLink);

	return (
		<>
			<HeaderLabel />
			<DropdownMenuSeparator />
			{isLinkToValidArticle && (
				<>
					<PropsEditorTrigger
						isCategory={isCategory}
						item={itemProps}
						itemLink={itemLink}
						setItemLink={setItemLink}
						setItemPropsData={setItemPropsData}
					/>
					{isCurrentItem && <TemplateItemList itemRefPath={itemLink.ref.path} />}
				</>
			)}
			<ArticleMoveAction articlePath={itemProps?.ref?.path} />
			{isLinkToValidArticle && <ArticleFavoriteSettingsButton itemLinkPath={itemLink.ref.path} />}
			{isLinkToValidArticle && <SearchInScopeTrigger isCategory={isCategory} itemLink={itemLink} />}
			<DropdownMenuSeparator />
			{isLinkToValidArticle && (
				<>
					<ShareAction isArticle path={itemLink.pathname} />
					<ArticleLinks itemRefPath={itemLink.ref.path} />
					<DropdownMenuSeparator />
				</>
			)}
			<HistoryTrigger item={itemProps} />
			<ArticleEditMarkdownTrigger
				isCurrentItem={isCurrentItem}
				isTemplate={itemProps?.template?.length > 0}
				item={itemProps}
			/>
			{isLinkToValidArticle && isCurrentItem && <EnterpriseCheckStyleGuide />}
			<DropdownMenuSeparator />
			{isLinkToValidArticle && (
				<ExportToDocxOrPdf
					fileName={itemProps.fileName}
					isCategory={isCategory}
					itemRefPath={itemLink.ref.path}
				/>
			)}
			{PageDataContextService.value.conf.enterprise.gesUrl && (
				<>
					<DropdownMenuSeparator />
					<NotificationSettingsButton itemRefPath={itemLink.ref.path} />
				</>
			)}
			<ShowInExplorer item={itemLink} />
			<DropdownMenuSeparator />
			<BugsnagTrigger itemLogicPath={itemLink.ref.path} />
			<DropdownMenuSeparator />
			<DeleteItemTrigger isCategory={isCategory} itemLink={itemLink} />
		</>
	);
};
