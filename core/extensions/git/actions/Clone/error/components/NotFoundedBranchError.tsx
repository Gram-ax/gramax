import t from "@ext/localization/locale/translate";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";

const NotFoundedBranchError = ({
	version,
	notFoundedBranch,
	onCancelClick,
}: {
	version?: string;
	notFoundedBranch: string;
	onCancelClick: () => void;
}) => {
	return (
		<InfoModalForm
			closeButton={{ text: t("ok") }}
			onCancelClick={onCancelClick}
			title={`${t("branch")} ${notFoundedBranch} ${t("not-found2").toLowerCase()}`}
			version={version}
		>
			<div className="article">
				<span>{t("clone-branch-not-found")}</span>
			</div>
		</InfoModalForm>
	);
};

export default NotFoundedBranchError;
