import Tooltip from "@components/Atoms/Tooltip";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
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
	// temp
	isLocal?: boolean;
	iconCode?: string;
	iconViewBox?: string;
	tooltipContent?: string;
	data?: { lastCommitAuthor?: string; lastCommitModify: string };
	mergeRequest?: MergeRequest;
	disable?: boolean;
	dateWidth?: "wide" | "narrow" | "auto";
	showBranchMenu?: boolean;
	closeList?: () => void;
	onMergeRequestCreate?: () => void;
}

const GitDateSideBar = ({
	title,
	currentBranchName,
	//temp
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	isLocal,
	iconCode,
	iconViewBox,
	tooltipContent,
	data,
	mergeRequest,
	disable = false,
	dateWidth = "auto",
	showBranchMenu = false,
	closeList,
	onMergeRequestCreate,
}: GitDateSideBarProps) => {
	const [isDevMode] = useState(() => getIsDevMode());

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
				titleComponent={isDevMode && mergeRequest ? <MergeRequestIcon /> : undefined}
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
					showBranchMenu && isDevMode && (
						<BranchMenu
							key={1}
							closeList={closeList}
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
