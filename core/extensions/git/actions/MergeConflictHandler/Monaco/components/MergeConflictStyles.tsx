import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { CSSProperties, ReactNode } from "react";

const MergeConflictStyles = ({
	children,
	className,
	style,
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}) => {
	return (
		<div style={style} className={classNames("merge-conflict-styles", {}, [className])}>
			{children}
		</div>
	);
};

export default styled(MergeConflictStyles)`
	.codelens-decoration > a {
		color: var(--color-link) !important;
	}
	.codelens-decoration > a:hover {
		--vscode-editorLink-activeForeground: var(--color-link);
		text-decoration: underline;
	}

	.vscode-merge-current {
		background-color: rgba(64, 200, 174, 0.5);
	}

	.vscode-merge-incoming {
		background-color: rgba(64, 166, 255, 0.5);
	}

	.vscode-merge-common-base {
		background-color: rgba(96, 96, 96, 0.4);
	}

	.content-opacity {
		opacity: 0.4;
	}

	.git-marks-opacity {
		color: gray !important;
		opacity: 0.3;
	}

	.vscode-merge-after-text-light {
		color: rgb(113, 113, 113) !important;
	}

	.vscode-merge-after-text-dark {
		color: rgba(204, 204, 204, 0.7) !important;
	}
`;
