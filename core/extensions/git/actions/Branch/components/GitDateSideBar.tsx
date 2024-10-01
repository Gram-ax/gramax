import GitDateInfo from "@ext/git/actions/Branch/components/GitDateInfo";
import SmallGitDateInfo from "@ext/git/actions/Branch/components/SmallGItDateInfo";
import { useLayoutEffect, useRef, useState } from "react";
import Icon from "../../../../../components/Atoms/Icon";
import Sidebar from "../../../../../components/Layouts/Sidebar";

const GitDateSideBar = ({
	title,
	iconCode,
	iconViewBox,
	tooltipContent,
	data,
	disable = false,
	dateWidth = "auto",
}: {
	title: string;
	iconCode?: string;
	iconViewBox?: string;
	tooltipContent?: string;
	data?: { lastCommitAuthor?: string; lastCommitModify: string };
	disable?: boolean;
	dateWidth?: "wide" | "narrow" | "auto";
}) => {
	const ref = useRef<HTMLDivElement>();
	const [width, setWidth] = useState(0);

	useLayoutEffect(() => {
		setWidth(ref.current.getBoundingClientRect().width);
	}, []);

	const getDateComponent = () => {
		switch (dateWidth) {
			case "auto":
				return width > 350 ? (
					<GitDateInfo key="dateInfo" data={data} />
				) : (
					<SmallGitDateInfo key="smallDateInfo" data={data} />
				);
			case "narrow":
				return <SmallGitDateInfo key="smallDateInfo" data={data} />;
			case "wide":
				return <GitDateInfo key="dateInfo" data={data} />;
		}
	};

	return (
		<div ref={ref} style={{ width: "100%", padding: "6px 15px" }}>
			<Sidebar
				disable={disable}
				title={title}
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
				rightActions={data ? [[getDateComponent()]] : null}
			/>
		</div>
	);
};
export default GitDateSideBar;
