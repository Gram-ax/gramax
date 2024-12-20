import EditInGramax from "@components/Actions/EditInGramax";
import ShowInExplorer from "@components/Actions/ShowInExplorer";
import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import BugsnagLogsModal from "@ext/bugsnag/components/BugsnagLogsModal";
import EnterpriseCheckStyleGuide from "@ext/enterprise/components/EnterpriseCheckStyleGuide";
import t from "@ext/localization/locale/translate";
import StyleGuideMenu from "@ext/StyleGuide/components/StyleGuideMenu";
import { FC, useEffect, useState } from "react";
import FileEditor from "../../extensions/artilce/actions/FileEditor";
import History from "../../extensions/git/actions/History/component/History";

interface ArticleActionsProps {
	isCatalogExist: boolean;
	hasRenderableActions: (hasActionsToRender: boolean) => void;
}

const ArticleActions: FC<ArticleActionsProps> = ({ isCatalogExist, hasRenderableActions }) => {
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const pageData = PageDataContextService.value;
	const [isDevMode] = useState(() => getIsDevMode());
	const { isLogged } = pageData;
	const { isReadOnly } = pageData.conf;
	const isArticleExist = !!articleProps.fileName;

	useEffect(() => {
		if (!isCatalogExist) return hasRenderableActions(true);
		if ((isLogged || !isReadOnly) && !!catalogProps.sourceName) return hasRenderableActions(true);
		if (isReadOnly && !isDevMode) return;
		return hasRenderableActions(isLogged);
	});

	if (!isCatalogExist)
		return (
			<>
				<EditInGramax />
				<BugsnagLogsModal />
			</>
		);

	return (
		<>
			<IsReadOnlyHOC>
				<History key="history" />
				<BugsnagLogsModal key="bugsnag" />
				<FileEditor
					key="file-editor"
					trigger={
						<ListItem disabled={!isArticleExist} iconCode="file-pen" text={t("article.edit-markdown")} />
					}
				/>
			</IsReadOnlyHOC>
			{(isLogged || !isReadOnly) && !!catalogProps.sourceName && <EditInGramax key="edit-gramax" />}
			<ShowInExplorer />
			<EnterpriseCheckStyleGuide />
			{/* {isDevMode && <StyleGuideMenu />} */}
		</>
	);
};

export default ArticleActions;
