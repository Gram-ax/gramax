import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import t from "@ext/localization/locale/translate";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import type { GetErrorComponentProps } from "../../../../../errorHandlers/logic/GetErrorComponent";

const BranchWasDeletedErrorComponent = ({ onCancelClick }: GetErrorComponentProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onOk = () => {
		BranchUpdaterService.updateBranch(apiUrlCreator);
		ArticleUpdaterService.update(apiUrlCreator);
		onCancelClick();
	};

	return (
		<>
			<DialogErrorHeader
				color="var(--color-danger)"
				icon="circle-x"
				title={t("git.branch.error.has-been-deleted.title")}
			/>
			<DialogBody>
				<p>{t("git.branch.error.has-been-deleted.body")}</p>
			</DialogBody>
			<DialogFooterTemplate primaryButton={t("ok")} primaryButtonProps={{ onClick: onOk }} />
		</>
	);
};

export default BranchWasDeletedErrorComponent;
