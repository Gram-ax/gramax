import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { CSSProperties } from "react";

interface StatusBarWrapperProps {
	children?: JSX.Element;
	dataQa?: string;
	onClick?: () => void;
	iconCode?: string;
	iconStyle?: CSSProperties;
	tooltipText?: string;
	tooltipArrow?: boolean;
	isShow?: boolean;
	iconStrokeWidth?: string;
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
	const { children, dataQa, onClick, iconCode, iconStyle, tooltipText, isShow, iconStrokeWidth } = props;

	return (
		<Wrapper data-qa={dataQa} show={isShow}>
			<StatusBarElement
				onClick={onClick}
				iconCode={iconCode}
				iconStyle={iconStyle}
				tooltipText={tooltipText}
				iconStrokeWidth={iconStrokeWidth}
			>
				{children}
			</StatusBarElement>
		</Wrapper>
	);
};

export default StatusBarWrapper;
