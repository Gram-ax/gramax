import { classNames } from "@components/libs/classNames";
import useDragScrolling from "@core-ui/hooks/useDragScrolling";
import { cssMedia } from "@core-ui/utils/cssUtils";
import scrollUtils from "@core-ui/utils/scrollUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@react-hook/media-query";
import {
	CSSProperties,
	forwardRef,
	MutableRefObject,
	ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

interface ScrollableProps {
	children: ReactNode;
	showTopBottomShadow?: boolean;
	boxShadowStyles?: { top?: string; bottom?: string };
	onScroll?: (isTop: boolean, isBottom: boolean) => void;
	hasScroll?: (hasScroll: boolean) => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	dragScrolling?: boolean;
	style?: CSSProperties;
	className?: string;
}

const Scrollable = forwardRef((props: ScrollableProps, ref: MutableRefObject<HTMLDivElement>) => {
	const {
		children,
		onScroll,
		hasScroll,
		onMouseEnter,
		onMouseLeave,
		className,
		showTopBottomShadow = true,
		dragScrolling = true,
		style,
	} = props;
	const [containerWidth, setContainerWidth] = useState(0);
	const containerRef = ref || useRef<HTMLDivElement>(null);
	const [hasElementScroll, setHasElementScroll] = useState(false);
	const narrowMedia = useMediaQuery(cssMedia.JSnarrow);

	const [isBottom, setIsBottom] = useState(false);
	const [isTop, setIsTop] = useState(true);
	const [dragScrollingState] = useState(dragScrolling);

	useLayoutEffect(() => {
		setContainerWidth(containerRef.current?.getBoundingClientRect().width);
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const contentElement = container.firstElementChild?.firstElementChild;
		if (!contentElement) return;

		const onResize = () => {
			const rect = container.getBoundingClientRect();
			setContainerWidth(rect.width);

			const scroll = scrollUtils.hasScroll(container);
			setHasElementScroll(scroll);
			hasScroll?.(scroll);

			const isTop = scrollUtils.scrollPositionIsTop(container);
			const isBottom = scrollUtils.scrollPositionIsBottom(container);
			setIsTop(isTop);
			setIsBottom(isBottom);
		};

		const resizeObserver = new ResizeObserver(onResize);

		resizeObserver.observe(container);
		resizeObserver.observe(contentElement);

		return () => {
			resizeObserver.disconnect();
		};
	}, [containerRef.current]);

	useEffect(() => {
		if (!containerRef.current) return;
		const scroll = scrollUtils.hasScroll(containerRef.current);
		setHasElementScroll(scroll);
		hasScroll?.(scroll);
	}, [children]);

	if (dragScrollingState) useDragScrolling(containerRef, 30);

	return (
		<div
			style={style}
			ref={containerRef}
			className={classNames(className, {
				"has-top-shadow": showTopBottomShadow && hasElementScroll && !isTop,
				"has-bottom-shadow": showTopBottomShadow && hasElementScroll && !isBottom,
				"is-mobile": narrowMedia,
				"no-scroll": !hasElementScroll,
			})}
			onMouseEnter={() => {
				if (onMouseEnter) onMouseEnter();
			}}
			onMouseLeave={() => {
				if (onMouseLeave) onMouseLeave();
			}}
			onScroll={() => {
				if (!containerRef.current) return;
				const isTop = scrollUtils.scrollPositionIsTop(containerRef.current);
				const isBottom = scrollUtils.scrollPositionIsBottom(containerRef.current);
				setIsTop(isTop);
				setIsBottom(isBottom);
				onScroll?.(isTop, isBottom);
			}}
		>
			<div
				style={containerWidth ? Object.assign({ width: containerWidth }, style) : style}
				className="scrolling-content"
			>
				{children}
			</div>
		</div>
	);
});

export default styled(Scrollable)`
	width: inherit;
	height: inherit;
	position: relative;
	overflow: hidden;

	&.has-top-shadow {
		box-shadow: ${({ boxShadowStyles }) =>
			boxShadowStyles?.top || `0px 6px 5px -5px var(--color-diff-entries-shadow) inset`};
	}

	&.has-bottom-shadow {
		box-shadow: ${({ boxShadowStyles }) =>
			boxShadowStyles?.bottom || `0px -6px 5px -5px var(--color-diff-entries-shadow) inset`};
	}

	&.has-top-shadow.has-bottom-shadow {
		box-shadow: ${({ boxShadowStyles }) => `${
			boxShadowStyles?.top || `0px 6px 5px -5px var(--color-diff-entries-shadow) inset`
		},
				${boxShadowStyles?.bottom || `0px -6px 5px -5px var(--color-diff-entries-shadow) inset`}
			`};
	}

	&:hover,
	&.is-mobile {
		overflow-y: auto;
	}

	::-webkit-scrollbar {
		height: var(--scroll-width);
		width: var(--scroll-width);
	}

	.scrolling-content {
		height: 100%;
	}

	&.no-scroll {
		overflow-y: hidden;
	}
`;
