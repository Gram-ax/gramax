import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import SpinnerLoader from "../../../../../components/Atoms/SpinnerLoader";
import StatusBarWrapper from "@components/Layouts/StatusBar/StatusBarWrapper";

interface BranchProps {
	branch: GitBranchData;
	show: boolean;
	onClick?: () => void;
}

const Branch = ({ branch, show, onClick }: BranchProps) => {
	const branchName = branch?.name;

	return (
		<StatusBarWrapper
			dataQa="qa-branch"
			tooltipText={t("git.checkout.change-branch")}
			iconCode="git-branch"
			iconStyle={{ color: show ? "var(--color-primary)" : "white" }}
			onClick={onClick}
			isShow={show}
		>
			<span>{branchName ? branchName : <SpinnerLoader width={12} height={12} />}</span>
		</StatusBarWrapper>
	);
};

export default Branch;
