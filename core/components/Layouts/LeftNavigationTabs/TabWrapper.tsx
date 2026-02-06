import Header from "@components/Layouts/LeftNavigationTabs/Header";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { forwardRef } from "react";

export const TAB_TRANSITION_TIME = 150;

const Wrapper = styled.div<{ height: number }>`
	overflow: hidden;
	height: 0;
	width: 100%;
	font-size: 12px;
	color: var(--color-merge-request-text);
	background-color: var(--color-merge-request-bg);
	transition: height var(--transition-time-fast) ease-out;
	line-height: 1.6;
	z-index: var(--z-index-base);
	pointer-events: none;

	border-width: 0px;
	border-style: solid;
	border-color: var(--color-merge-request-border);

	padding: 0;
	gap: 0.8em;

	&:not(.show) *,
	&:not(.show) > * {
		display: none;
		margin: 0;
		padding: 0;
		height: 0 !important;
	}

	&.show {
		margin-top: unset;
		pointer-events: auto;
		padding: 0.92em 0;
		border-width: 1px 1px 0px 0px;
		height: ${(props) => props.height}px;
	}

	&.show.is-top {
		border-bottom: 1px solid var(--color-merge-request-border);
	}
`;
interface TabWrapperProps {
	children: JSX.Element;
	show: boolean;
	title: string;
	onClose?: () => void;
	contentHeight?: number;
	isTop?: boolean;
	titleRightExtension?: JSX.Element;
	actions?: JSX.Element;
	className?: string;
	dataQa?: string;
}

const TabWrapper = forwardRef<HTMLDivElement, TabWrapperProps>((props, ref) => {
	const { children, show, title, titleRightExtension, onClose, contentHeight, isTop, actions, className, dataQa } =
		props;

	return (
		<Wrapper
			className={classNames("tab-wrapper", { show, "is-top": isTop }, [className])}
			data-qa={dataQa}
			height={show ? contentHeight : undefined}
			ref={ref}
		>
			<Header
				actions={actions}
				onClose={onClose}
				rightExtension={titleRightExtension}
				show={show}
				title={title}
			/>
			{children}
		</Wrapper>
	);
});

export default TabWrapper;
