import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { CSSProperties } from "react";

interface StatusBarWrapperProps {
	children?: JSX.Element;
	dataQa?: string;
	onClick?: () => void;
	iconCode?: string;
	iconStyle?: CSSProperties;
	tooltipText?: string;
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
