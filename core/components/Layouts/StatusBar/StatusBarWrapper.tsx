import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { CSSProperties, ReactNode } from "react";

interface StatusBarWrapperProps {
	children?: JSX.Element;
	dataQa?: string;
	onClick?: () => void;
	disable?: boolean;
	iconCode?: string;
	iconStyle?: CSSProperties;
	tooltipText?: ReactNode;
	tooltipArrow?: boolean;
	showTooltip?: boolean;
	isShow?: boolean;
	iconStrokeWidth?: string;
	additionalStyles?: CSSProperties;
}

const Wrapper = styled.div<{ show?: boolean }>`
	${({ show }) =>
		show &&
		css`
			background-color: var(--color-merge-request-bg);

			span {
				color: var(--color-primary);
			}
		`}
`;

const StatusBarWrapper = (props: StatusBarWrapperProps) => {
	const {
		children,
		dataQa,
		onClick,
		disable,
		iconCode,
		iconStyle,
		tooltipText,
		isShow,
		iconStrokeWidth,
		additionalStyles,
		showTooltip,
	} = props;

	return (
		<Wrapper data-qa={dataQa} show={isShow} style={additionalStyles}>
			<StatusBarElement
				disable={disable}
				iconCode={iconCode}
				iconStrokeWidth={iconStrokeWidth}
				iconStyle={iconStyle}
				onClick={onClick}
				showTooltip={showTooltip}
				tooltipText={tooltipText}
			>
				{children}
			</StatusBarElement>
		</Wrapper>
	);
};

export default StatusBarWrapper;
