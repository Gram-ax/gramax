import EditInGramax from "@components/Actions/EditInGramax";
import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import BugsnagLogsModal from "@ext/bugsnag/components/BugsnagLogsModal";
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
	const isServerApp = PageDataContextService.value.conf.isServerApp;
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const pageData = PageDataContextService.value;
	const [isDevMode] = useState(() => getIsDevMode());
	const { isLogged } = pageData;
	const { isReadOnly } = pageData.conf;
	const isArticleExist = !!articleProps.fileName;

	useEffect(() => {
		if (!isCatalogExist) return;
		if ((isLogged || !isReadOnly) && !!catalogProps.sourceName) return hasRenderableActions(true);
		if (isLogged) return hasRenderableActions(true);
		if (!isLogged) return hasRenderableActions(false);
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
			{isLogged && <History key="history" />}
			{(isLogged || !isReadOnly) && !!catalogProps.sourceName && <EditInGramax key="edit-gramax" />}
			{isLogged && <BugsnagLogsModal key="bugsnag" />}
			{isLogged && !isServerApp && (
				<FileEditor
					key="file-editor"
					trigger={
						<ListItem disabled={!isArticleExist} iconCode="file-pen" text={t("article.edit-markdown")} />
					}
				/>
			)}
			{isDevMode && <StyleGuideMenu />}
		</>
	);
};

export default ArticleActions;
