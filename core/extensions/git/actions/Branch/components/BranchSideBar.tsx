import BranchInfo from "@ext/git/actions/Branch/components/BranchInfo";
import SmallBranchInfo from "@ext/git/actions/Branch/components/SmallBranchInfo";
import { useEffect, useRef, useState } from "react";
import Icon from "../../../../../components/Atoms/Icon";
import Sidebar from "../../../../../components/Layouts/Sidebar";

const BranchSideBar = ({
	name,
	iconCode,
	iconViewBox,
	tooltipContent,
	data,
	disable = false,
}: {
	name: string;
	iconCode?: string;
	iconViewBox?: string;
	tooltipContent?: string;
	data?: { lastCommitAuthor: string; lastCommitModify: string };
	disable?: boolean;
}) => {
	const ref = useRef<HTMLDivElement>();
	const [width, setWidth] = useState(0);

	useEffect(() => {
		setWidth(ref.current.getBoundingClientRect().width);
	});

	const rightActions = width > 350 ? <BranchInfo key={0} data={data} /> : <SmallBranchInfo key={0} data={data} />;

	return (
		<div ref={ref} style={{ width: "100%", padding: "6px 15px" }}>
			<Sidebar
				disable={disable}
				title={name}
				leftActions={[
					iconCode ? (
						<Icon
							key={0}
							code={iconCode}
							tooltipContent={tooltipContent}
							viewBox={iconViewBox}
							style={{ fontSize: "1rem", color: "var(--color-placeholder)", fontWeight: 300 }}
						/>
					) : null,
				]}
				rightActions={[data ? rightActions : null]}
			/>
		</div>
	);
};
export default BranchSideBar;
