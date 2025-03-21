import ArticleActions from "@components/Actions/ArticleActions";
import ExportToDocxOrPdf from "@components/Actions/ExportToDocxOrPdf";
import { TextSize } from "@components/Atoms/Button/Button";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { CSSProperties, Dispatch, SetStateAction, useEffect, useState } from "react";
import { ItemLink } from "../navigation/NavigationLinks";
import DeleteItem from "./actions/DeleteItem";
import PropsEditor from "./actions/propsEditor/components/PropsEditor";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";

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

const EditMenu = ({ itemLink, isCategory, setItemLink, textSize, style, onOpen, onClose }: EditMenuProps) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const articleProps = ArticlePropsService.value;

	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;
	const isCatalogExist = !!catalogProps.name;
	const hasError = articleProps?.errorCode;

	const [brotherFileNames, setBrotherFileName] = useState<string[]>(null);
	const [isCurrentItem, setIsCurrentItem] = useState(articleProps?.ref?.path == itemLink?.ref?.path);
	const [itemProps, setItemProps] = useState<ClientArticleProps>(isCurrentItem ? { ...articleProps } : null);

	useEffect(() => {
		setIsCurrentItem(articleProps?.ref?.path == itemLink?.ref?.path);
	}, [articleProps?.ref?.path]);

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

	return (
		<StyledDiv onClick={(e) => e.stopPropagation()}>
			<PopupMenuLayout
				isInline
				trigger={<ButtonLink textSize={textSize} style={style} iconCode="ellipsis-vertical" />}
				offset={[0, 10]}
				tooltipText={t("actions")}
				onOpen={() => {
					onOpen?.();
					if (!isCurrentItem) setItemPropsData();
					if (!isReadOnly) setBrotherFileNamesData();
				}}
				onClose={onClose}
				appendTo={() => document.body}
			>
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
						/>
						{!hasError && (
							<ExportToDocxOrPdf
								isCategory={isCategory}
								fileName={itemProps?.fileName}
								pathname={itemProps?.pathname}
								itemRefPath={itemProps?.ref?.path}
							/>
						)}
						<DeleteItem
							isCategory={isCategory}
							itemPath={itemLink?.ref?.path}
							itemLink={itemLink?.pathname}
						/>
					</>
				) : (
					<>
						{!hasError && (
							<ExportToDocxOrPdf
								isCategory={isCategory}
								fileName={itemProps?.fileName}
								pathname={itemProps?.pathname}
								itemRefPath={itemProps?.ref?.path}
							/>
						)}
					</>
				)}
			</PopupMenuLayout>
		</StyledDiv>
	);
};

export default EditMenu;
