import EditInGramax from "@components/Actions/EditInGramax";
import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import BugsnagLogsModal from "@ext/bugsnag/components/BugsnagLogsModal";
import t from "@ext/localization/locale/translate";
import FileEditor from "../../extensions/artilce/actions/FileEditor";
import History from "../../extensions/git/actions/History/component/History";

const ArticleActions = ({ isCatalogExist }: { isCatalogExist: boolean }): JSX.Element => {
	const isServerApp = PageDataContextService.value.conf.isServerApp;
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const pageData = PageDataContextService.value;
	const { isLogged } = pageData;
	const { isReadOnly } = pageData.conf;
	const isArticleExist = !!articleProps.fileName;
	if (!isCatalogExist) return <BugsnagLogsModal />;

	if (catalogProps.readOnly) return null;

	return (
		<>
			{isLogged && <History />}
			<EditInGramax shouldRender={(isLogged || !isReadOnly) && !!catalogProps.sourceName} />
			{isLogged && (
				<>
					<BugsnagLogsModal />
					<FileEditor
						shouldRender={!isServerApp}
						trigger={
							// <Tooltip
							// 	disabled={!!articleProps.fileName}
							// 	content={t("create-files-to-edit-markdown")}
							// >
							<ListItem
								disabled={!isArticleExist}
								iconCode="file-pen"
								text={t("article.edit-markdown")}
							/>
							// </Tooltip>
						}
					/>
				</>
			)}
		</>
	);
};

export default ArticleActions;
