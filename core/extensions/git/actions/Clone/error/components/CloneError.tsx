import ErrorForm from "../../../../../errorHandlers/client/components/ErrorForm";
import useLocalize from "../../../../../localization/useLocalize";

const CloneError = ({ notFoundedBranch, onCancelClick }: { notFoundedBranch: string; onCancelClick: () => void }) => {
	return (
		<ErrorForm
			onCancelClick={onCancelClick}
			title={`${useLocalize("branch")} ${notFoundedBranch} ${useLocalize("notFound2").toLowerCase()}`}
			closeButton={{ text: useLocalize("ok") }}
		>
			<div className="article">
				<span>{useLocalize("cloneBranchNotFound")}</span>
			</div>
		</ErrorForm>
	);
};

export default CloneError;
