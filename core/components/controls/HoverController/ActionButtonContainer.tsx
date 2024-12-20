import styled from "@emotion/styled";
import { memo, ReactNode } from "react";

interface ActionButtonContainerProps {
	children: ReactNode;
	className?: string;
}

const ActionButtonContainer = ({ children, className }: ActionButtonContainerProps) => {
	return (
		<div contentEditable={false} className={className}>
			{children}
		</div>
	);
};

export default memo(styled(ActionButtonContainer)`
	display: flex;
	border-radius: var(--radius-small);
	box-shadow: var(--menu-tooltip-shadow);
	color: var(--color-primary-general);
	background: var(--color-article-bg);
	overflow: hidden;
	max-width: 100%;
	max-height: 100%;
`);
