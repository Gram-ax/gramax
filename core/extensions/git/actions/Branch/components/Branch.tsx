import StatusBarWrapper from "@components/Layouts/StatusBar/StatusBarWrapper";
import useIsOverflow from "@core-ui/hooks/useIsOverflow";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import { Loader } from "@ui-kit/Loader";
import { useRef } from "react";

interface BranchProps {
	branch: GitBranchData;
	show: boolean;
	onClick?: () => void;
	disable?: boolean;
}

const Branch = ({ branch, show, onClick, disable }: BranchProps) => {
	const branchName = branch?.name;
	const nameRef = useRef<HTMLSpanElement>(null);
	const isOverflow = useIsOverflow(nameRef, [branchName]);

	return (
		<StatusBarWrapper
			additionalStyles={{ overflow: "hidden" }}
			dataQa="qa-branch"
			disable={disable}
			iconCode="git-branch"
			iconStyle={{ color: show ? "var(--color-primary)" : "white" }}
			isShow={show}
			onClick={onClick}
			tooltipText={
				isOverflow && branchName ? <div className="break-all">{branchName}</div> : t("git.branch.management")
			}
		>
			<span className="max-w-full overflow-hidden text-ellipsis align-top" ref={nameRef}>
				{branchName ? branchName : <Loader className="p-0" size="xs" />}
			</span>
		</StatusBarWrapper>
	);
};

export default Branch;
