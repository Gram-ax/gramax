import StatusBarWrapper from "@components/Layouts/StatusBar/StatusBarWrapper";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import SpinnerLoader from "../../../../../components/Atoms/SpinnerLoader";

interface BranchProps {
	branch: GitBranchData;
	show: boolean;
	onClick?: () => void;
}

const Branch = ({ branch, show, onClick }: BranchProps) => {
	const branchName = branch?.name;

	return (
		<StatusBarWrapper
			additionalStyles={{ overflow: "hidden" }}
			dataQa="qa-branch"
			iconCode="git-branch"
			iconStyle={{ color: show ? "var(--color-primary)" : "white" }}
			isShow={show}
			onClick={onClick}
			tooltipText={t("git.branch.management")}
		>
			<span>{branchName ? branchName : <SpinnerLoader height={12} width={12} />}</span>
		</StatusBarWrapper>
	);
};

export default Branch;
