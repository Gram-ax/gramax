import EditInGramax from "@components/Actions/EditInGramax";
import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import BugsnagLogsModal from "@ext/bugsnag/components/BugsnagLogsModal";
import useHasRemoteStorage from "@ext/storage/logic/utils/useHasRemoteStorage";
import FileEditor from "../../extensions/artilce/actions/FileEditor";
import History from "../../extensions/git/actions/History/component/History";
import useLocalize from "../../extensions/localization/useLocalize";
import ExportToDocxOrPdf from "./ExportToDocxOrPdf";

const ArticleActions = (): JSX.Element => {
	const isServerApp = PageDataContextService.value.conf.isServerApp;
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageData = PageDataContextService.value;
	const { isLogged } = pageData;
	const { isReadOnly } = pageData.conf;
	const hasRemoteStorage = useHasRemoteStorage();

	if (catalogProps.readOnly) return null;

	return (
		<>
			<EditInGramax shouldRender={isReadOnly && isLogged && !!catalogProps.sourceName} />
			<ExportToDocxOrPdf
				downloadLink={apiUrlCreator.getWordSaveUrl(articleProps.ref.path)}
				fileName={articleProps.fileName}
			/>
			{isLogged && (
				<>
					<History shouldRender={hasRemoteStorage} />
					<BugsnagLogsModal />
					<FileEditor
						shouldRender={!isServerApp}
						trigger={<ListItem iconCode="file-pen" text={useLocalize("editMarkdown")} />}
					/>
				</>
			)}
		</>
	);
};

export default ArticleActions;
