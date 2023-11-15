import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Code from "@components/Atoms/Code";
import styled from "@emotion/styled";
import useLocalize from "../../../../../../localization/useLocalize";

const BottomMergeButton = styled(
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
			<div className={"bottom-part-conflict " + className}>
				<div className="conflicted-content">
					<Code>{children}</Code>
				</div>
				<div className="conflict-button-container">
					<Button buttonStyle={ButtonStyle.purple} onClick={onClick}>
						{useLocalize(resolved ? "cancel" : "select")}
					</Button>
					<span className="other-version-text">{useLocalize("otherVersion")}</span>
				</div>
			</div>
		);
	},
)`
	background-color: var(--merger-bottom-bg-opacity);

	.conflict-button-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--merger-bottom-bg);
	}

	.conflict-button-container,
	pre {
		padding: 0.5rem;
	}

	.other-version-text {
		color: var(--color-primary-general);
		font-weight: 400;
	}

	.conflicted-content {
		text-wrap: wrap;
	}
`;

export default BottomMergeButton;
