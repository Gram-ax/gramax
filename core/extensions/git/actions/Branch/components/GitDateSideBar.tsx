import Tooltip from "@components/Atoms/Tooltip";
import BranchMenu from "@ext/git/actions/Branch/components/BranchMenu";
import GitDateInfo from "@ext/git/actions/Branch/components/GitDateInfo";
import SmallGitDateInfo from "@ext/git/actions/Branch/components/SmallGItDateInfo";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import { useLayoutEffect, useRef, useState } from "react";
import Icon from "../../../../../components/Atoms/Icon";
import Sidebar from "../../../../../components/Layouts/Sidebar";

interface DateComponentProps {
	width: number;
	data?: { lastCommitAuthor?: string; lastCommitModify: string };
	dateWidth: "wide" | "narrow" | "auto";
}

const DateComponent = ({ width, data, dateWidth = "auto" }: DateComponentProps) => {
	if (dateWidth === "wide") return <GitDateInfo data={data} />;
	if (dateWidth === "narrow") return <SmallGitDateInfo data={data} />;
	if (width > 350) return <GitDateInfo data={data} />;
	else return <SmallGitDateInfo data={data} />;
};

const MergeRequestIcon = () => {
	return (
		<Tooltip content="В этой ветке есть запросы на объединение">
			<Icon code="git-pull-request-arrow" />
		</Tooltip>
	);
};

interface GitDateSideBarProps {
	title: string;
	currentBranchName?: string;
	iconCode?: string;
	iconViewBox?: string;
	tooltipContent?: string;
	data?: { lastCommitAuthor?: string; lastCommitModify: string };
	mergeRequest?: MergeRequest;
	disable?: boolean;
	dateWidth?: "wide" | "narrow" | "auto";
	showBranchMenu?: boolean;
	refreshList?: () => void;
	onMergeRequestCreate?: () => void;
}

const GitDateSideBar = ({
	title,
	currentBranchName,
	iconCode,
	iconViewBox,
	tooltipContent,
	data,
	mergeRequest,
	disable = false,
	dateWidth = "auto",
	showBranchMenu = false,
	refreshList,
	onMergeRequestCreate,
}: GitDateSideBarProps) => {
	const ref = useRef<HTMLDivElement>();
	const [width, setWidth] = useState(0);

	useLayoutEffect(() => {
		setWidth(ref.current.getBoundingClientRect().width);
	}, []);

	return (
		<div ref={ref} style={{ width: "100%", padding: "6px 15px" }}>
			<Sidebar
				disable={disable}
				title={title}
				titleComponent={mergeRequest ? <MergeRequestIcon /> : undefined}
				leftActions={
					iconCode && [
						<Icon
							key={0}
							code={iconCode}
							tooltipContent={tooltipContent}
							viewBox={iconViewBox}
							style={{ fontSize: "1rem", color: "var(--color-placeholder)", fontWeight: 300 }}
						/>,
					]
				}
				rightActions={[
					data && <DateComponent key={0} width={width} data={data} dateWidth={dateWidth} />,
					showBranchMenu && (
						<BranchMenu
							key={1}
							refreshList={refreshList}
							branchName={title}
							onMergeRequestCreate={onMergeRequestCreate}
							currentBranchName={currentBranchName}
						/>
					),
				]}
			/>
		</div>
	);
};

export default GitDateSideBar;
