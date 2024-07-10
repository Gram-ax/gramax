import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";
import useLocalize from "../../../../../localization/useLocalize";

const NotFoundedBranchError = ({
	notFoundedBranch,
	onCancelClick,
}: {
	notFoundedBranch: string;
	onCancelClick: () => void;
}) => {
	return (
		<InfoModalForm
			onCancelClick={onCancelClick}
			title={`${useLocalize("branch")} ${notFoundedBranch} ${useLocalize("notFound2").toLowerCase()}`}
			closeButton={{ text: useLocalize("ok") }}
		>
			<div className="article">
				<span>{useLocalize("cloneBranchNotFound")}</span>
			</div>
		</InfoModalForm>
	);
};

export default NotFoundedBranchError;
