import Header from "@components/Layouts/LeftNavigationTabs/Header";
import { cn } from "@core-ui/utils/cn";
// biome-ignore lint/style/noRestrictedImports: expected
import styled from "@emotion/styled";
import { forwardRef, type ReactNode } from "react";

export const TAB_TRANSITION_TIME = 150;

const Wrapper = styled.div<{ height: number }>`
	overflow: hidden;
	height: 0;
	width: 100%;
	font-size: 12px;
	color: var(--color-merge-request-text);
	transition: height var(--transition-time-fast) ease-out;
	line-height: 1.6;
	z-index: var(--z-index-base);
	pointer-events: none;

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
		height: ${(props) => props.height}px;
	}

	&.show.is-top {
		border-bottom: 1px solid var(--color-merge-request-border);
	}
`;
interface TabWrapperProps {
	children: ReactNode;
	show: boolean;
	title?: string;
	onClose?: () => void;
	contentHeight?: number;
	isTop?: boolean;
	titleRightExtension?: JSX.Element;
	titleLeftExtension?: JSX.Element;
	actions?: JSX.Element;
	className?: string;
	dataQa?: string;
}

const TabWrapper = forwardRef<HTMLDivElement, TabWrapperProps>((props, ref) => {
	const {
		children,
		show,
		title,
		titleRightExtension,
		titleLeftExtension,
		onClose,
		contentHeight,
		isTop,
		actions,
		className,
		dataQa,
	} = props;
	return (
		<Wrapper
			className={cn(
				"tab-wrapper bg-secondary-bg border-secondary-border",
				show && "show",
				isTop && "is-top",
				show ? (isTop ? "border-b border-r border-t" : "border-t border-r") : "",
				className,
			)}
			data-qa={dataQa}
			height={show ? contentHeight : undefined}
			ref={ref}
		>
			{(titleLeftExtension || titleRightExtension || title) && (
				<Header
					actions={actions}
					leftExtension={titleLeftExtension}
					onClose={onClose}
					rightExtension={titleRightExtension}
					show={show}
					title={title}
				/>
			)}
			{children}
		</Wrapper>
	);
});

export default TabWrapper;
