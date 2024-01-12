import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import FileEditor from "../../extensions/artilce/actions/FileEditor";
import { openPrintView } from "../../extensions/artilce/actions/SaveAsPdf/OpenPrintView";
import BugReport from "../../extensions/bugsnag/components/BugReport";
import History from "../../extensions/git/actions/History/component/History";
import useLocalize from "../../extensions/localization/useLocalize";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import ArticleUpdaterService from "../Article/ArticleUpdater/ArticleUpdaterService";
import Icon from "../Atoms/Icon";
import ExportToDocxOrPdf from "./ExportToDocxOrPdf";

const ArticleActions = (): JSX.Element => {
	const theme = ThemeService.value;
	const isEdit = IsEditService.value;
	const isLogged = PageDataContextService.value.isLogged;
	const isServerApp = PageDataContextService.value.conf.isServerApp;
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		!catalogProps.readOnly && (
			<>
				<li>
					<ExportToDocxOrPdf
						text={useLocalize("article")}
						wordLink={{
							downloadLink: apiUrlCreator.getWordSaveUrl(articleProps.ref.path),
							fileName: articleProps.fileName,
						}}
						pdfPart={<a onClick={() => openPrintView(theme)}>PDF</a>}
					/>
				</li>
				{isLogged && (
					<>
						<li data-qa="qa-clickable">
							<History />
						</li>
						<IsReadOnlyHOC>
							{!articleProps?.errorCode && (
								<li data-qa="qa-clickable">
									<a
										onClick={() => {
											ArticleUpdaterService.update(apiUrlCreator);
											IsEditService.value = !isEdit;
										}}
									>
										<Icon code={isEdit ? "eye" : "pencil"} faFw={true} />
										<span>{useLocalize(isEdit ? "switchToViewMode" : "switchToEditMode")}</span>
									</a>
								</li>
							)}
						</IsReadOnlyHOC>
						<BugReport />
						{!isServerApp && (
							<FileEditor
								trigger={
									<li data-qa="qa-clickable">
										<a>
											<Icon code={"file-pen"} faFw={true} />
											<span>{useLocalize("editMarkdown")}</span>
										</a>
									</li>
								}
							/>
						)}
					</>
				)}
			</>
		)
	);
};

export default ArticleActions;
