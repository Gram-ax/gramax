import EditInGramax from "@components/Actions/EditInGramax";
import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import BugsnagLogsModal from "@ext/bugsnag/components/BugsnagLogsModal";
import t from "@ext/localization/locale/translate";
import FileEditor from "../../extensions/artilce/actions/FileEditor";
import History from "../../extensions/git/actions/History/component/History";

const ArticleActions = ({
	isCatalogExist,
	hasRenderableActions,
}: {
	isCatalogExist: boolean;
	hasRenderableActions: (hasActionsToRender: boolean) => void;
}): JSX.Element => {
	const isServerApp = PageDataContextService.value.conf.isServerApp;
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const pageData = PageDataContextService.value;
	const { isLogged } = pageData;
	const { isReadOnly } = pageData.conf;
	const isArticleExist = !!articleProps.fileName;

	if (!isCatalogExist) return <BugsnagLogsModal />;

	const actions = [];

	if (isLogged) {
		actions.push(<History key="history" />);
	}

	if ((isLogged || !isReadOnly) && !!catalogProps.sourceName) {
		actions.push(<EditInGramax key="edit-gramax" />);
	}

	if (isLogged) {
		actions.push(<BugsnagLogsModal key="bugsnag" />);

		if (!isServerApp) {
			actions.push(
				<FileEditor
					key="file-editor"
					trigger={
						<ListItem disabled={!isArticleExist} iconCode="file-pen" text={t("article.edit-markdown")} />
					}
				/>,
			);
		}
	}

	hasRenderableActions(actions.length > 0);

	return <>{actions}</>;
};

export default ArticleActions;
