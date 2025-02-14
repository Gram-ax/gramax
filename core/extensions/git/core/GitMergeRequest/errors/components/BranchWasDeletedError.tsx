import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";

const BranchWasDeletedErrorComponent = ({ onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<InfoModalForm
			title={t("git.branch.error.has-been-deleted.title")}
			icon={{ code: "circle-x", color: "var(--color-danger)" }}
			actionButton={{
				text: t("ok"),
				onClick: () => {
					BranchUpdaterService.updateBranch(apiUrlCreator);
					ArticleUpdaterService.update(apiUrlCreator);
					onCancelClick();
				},
			}}
		>
			<p>{t("git.branch.error.has-been-deleted.body")}</p>
		</InfoModalForm>
	);
};

export default BranchWasDeletedErrorComponent;
