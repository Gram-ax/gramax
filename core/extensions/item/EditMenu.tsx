import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import useLocalize from "../localization/useLocalize";
import { ItemLink } from "../navigation/NavigationLinks";
import DeleteItem from "./actions/DeleteItem";
import PropsEditor from "./actions/propsEditor/components/PropsEditor";

const EditMenu = ({
	itemLink,
	isCategory,
	setItemLink,
	onOpen,
	onClose,
}: {
	itemLink: ItemLink;
	isCategory: boolean;
	setItemLink: Dispatch<SetStateAction<ItemLink>>;
	onOpen?: () => void;
	onClose?: () => void;
}) => {
	const isEdit = IsEditService.value;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [brotherFileNames, setBrotherFileName] = useState<string[]>(null);
	const [isCurrentItem, setIsCurrentItem] = useState(articleProps.ref.path == itemLink.ref.path);
	const [itemProps, setItemProps] = useState<ClientArticleProps>(isCurrentItem ? { ...articleProps } : null);

	useEffect(() => {
		setIsCurrentItem(articleProps.ref.path == itemLink.ref.path);
	}, [articleProps.ref.path]);
	useEffect(() => {
		if (isCurrentItem) setItemProps(articleProps);
	}, [articleProps]);

	const setItemPropsData = async () => {
		const response = await FetchService.fetch(apiUrlCreator.getItemProps(itemLink.ref.path));
		if (!response.ok) return;
		const data = (await response.json()) as ClientArticleProps;
		setItemProps(data);
	};

	const setBrotherFileNamesData = async () => {
		const response = await FetchService.fetch(apiUrlCreator.getArticleBrotherFileNames(itemLink.ref.path));
		if (!response.ok) return;
		const data = (await response.json()) as string[];
		setBrotherFileName(data);
	};

	if (!isEdit) return null;
	return (
		<span onClick={(e) => e.stopPropagation()}>
			<PopupMenuLayout
				isInline
				bottomOffset={-3}
				tooltipText={useLocalize("editAndDelete")}
				onOpen={() => {
					if (onOpen) onOpen();
					if (!isCurrentItem) setItemPropsData();
					setBrotherFileNamesData();
				}}
				onClose={onClose}
				appendTo={() => document.body}
			>
				<PropsEditor
					item={itemProps}
					itemLink={itemLink}
					isCategory={isCategory}
					isCurrentItem={isCurrentItem}
					brotherFileNames={brotherFileNames}
					setItemLink={setItemLink}
				/>
				<DeleteItem isCategory={isCategory} itemPath={itemLink.ref.path} itemLink={itemLink.pathname} />
			</PopupMenuLayout>
		</span>
	);
};

export default EditMenu;
