import Header from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/Header";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { forwardRef } from "react";

const Wrapper = styled.div`
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
	}
`;
interface TabWrapperProps {
	children: JSX.Element;
	show: boolean;
	title: string;
	contentHeight?: number;
	titleRightExtension?: JSX.Element;
	onClose: () => void;
}

const TabWrapper = forwardRef<HTMLDivElement, TabWrapperProps>((props, ref) => {
	const { children, show, title, titleRightExtension, onClose, contentHeight } = props;

	return (
		<Wrapper ref={ref} className={classNames("tab-wrapper", { show })} style={{ height: show && contentHeight }}>
			<Header title={title} rightExtension={titleRightExtension} onClose={onClose} />
			{children}
		</Wrapper>
	);
});

export default TabWrapper;
