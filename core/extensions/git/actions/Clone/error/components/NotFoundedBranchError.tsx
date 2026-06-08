import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import t from "@ext/localization/locale/translate";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";

interface NotFoundedBranchErrorProps {
	version?: string;
	notFoundedBranch: string;
	onCancelClick: () => void;
}

const NotFoundedBranchError = ({ notFoundedBranch, onCancelClick }: NotFoundedBranchErrorProps) => {
	return (
		<>
			<DialogErrorHeader title={`${t("branch")} ${notFoundedBranch} ${t("not-found2").toLowerCase()}`} />
			<DialogBody>
				<div className="article">
					<span>{t("clone-branch-not-found")}</span>
				</div>
			</DialogBody>
			<DialogFooterTemplate primaryButton={t("ok")} primaryButtonProps={{ onClick: onCancelClick }} />
		</>
	);
};

export default NotFoundedBranchError;
