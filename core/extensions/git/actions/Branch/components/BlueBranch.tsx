import Icon from "@components/Atoms/Icon";
import { ReactNode } from "react";

const BlueBranch = ({ name }: { name: ReactNode }) => {
	return (
		<span
			style={{
				background: "var(--merge-branch-code-bg)",
				color: "var(--merge-branch-code-text)",
				fontWeight: "500",
				padding: "0 2px",
				borderRadius: "var(--radius-x-small)",
				fontSize: "12px",
				lineHeight: "16px",
			}}
		>
			<span style={{ marginRight: "2px" }}>
				<Icon code="git-branch" strokeWidth={"2.5px"} style={{ lineHeight: "normal" }} />
			</span>
			{name}
		</span>
	);
};

export default BlueBranch;
