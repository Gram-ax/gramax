import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Code from "@components/Atoms/Code";
import styled from "@emotion/styled";
import useLocalize from "../../../../../../localization/useLocalize";

const TopMergeButton = styled(
	({
		className,
		resolved,
		children,
		onClick,
	}: {
		resolved: boolean;
		children: React.ReactNode;
		onClick: () => void;
		className?: string;
	}) => {
		return (
			<div className={"top-part-conflict " + className}>
				<div className="conflict-button-container">
					<Button buttonStyle={ButtonStyle.blue} onClick={onClick}>
						{useLocalize(resolved ? "cancel" : "select")}
					</Button>
					<span className="current-version-text">{useLocalize("currentVersion")}</span>
				</div>
				<div className="conflicted-content">
					<Code>{children}</Code>
				</div>
			</div>
		);
	},
)`
	background-color: var(--merger-top-bg-opacity);

	.conflict-button-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--merger-top-bg);
	}

	.conflict-button-container,
	pre {
		padding: 0.5rem;
	}

	.current-version-text {
		color: var(--color-primary-general);
		font-weight: 400;
	}

	.conflicted-content {
		text-wrap: wrap;
	}
`;

export default TopMergeButton;
