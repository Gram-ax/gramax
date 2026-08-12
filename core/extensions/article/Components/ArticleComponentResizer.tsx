import { ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE } from "@components/Layouts/CatalogLayout/ArticleLayout/consts";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import { useTouchHandler } from "@core-ui/hooks/useTouchHandler";
import { cn } from "@core-ui/utils/cn";
import getScale from "@ext/markdown/elements/image/render/logic/getScale";
import {
	type HTMLAttributes,
	type ReactElement,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { tv } from "tailwind-variants";

type Scale = number | string;

interface ArticleComponentResizerProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
	selected?: boolean;
	scale?: Scale;
	defaultScale?: Scale;
	children?: ReactNode;
	disabled?: boolean;
	onChange?: (resize: string) => void;
	isPrint?: boolean;
}

const styles = tv({
	slots: {
		resizer: [
			"absolute -right-0.5 top-[50%] translate-y-[-50%] z-10",
			"border-2 border-[var(--color-focus)] w-1.5 h-full rounded-lg bg-white",
			"flex items-center max-h-[max(25%,1.5em)] transition-opacity duration-150 ease-in-out",
			"pointer-events-none cursor-col-resize",
		],
		container: [
			"mx-auto relative [&>.resizer]:pointer-events-none [&>.resizer]:hover:pointer-events-auto [&>.resizer][data-selected=true]:pointer-events-auto",
			"[&>.resizer]:opacity-0 [&>.resizer]:hover:opacity-100 [&>[aria-hidden=false]]:opacity-100",
		],
	},
});

export const ArticleComponentResizer = (props: ArticleComponentResizerProps): ReactElement => {
	const { className, scale, selected = false, onChange, children, disabled, defaultScale, isPrint, ...rest } = props;
	const [isFullArticle, setIsFullArticle] = useState(false);
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	const containerRef = useRef<HTMLDivElement>(null);
	const startWidthRef = useRef<number>(0);
	const startClientXRef = useRef<number>(0);
	const articleRef = ArticleRefService.value;
	const sidebarsIsPin = SidebarsIsPinService.value;

	const getContainer = useCallback(() => {
		const container = containerRef.current.closest("[data-resize-container]");
		if (!container) return containerRef.current;
		return container.parentElement;
	}, []);

	const hasFloat = useCallback(() => {
		const container = containerRef.current.closest("[data-float]");
		return !!container;
	}, []);

	const isNested = useCallback(() => {
		const el = containerRef.current;
		const component = el.closest("[data-component]");
		// Check is nested in other components like table cells, list items, notes and others
		return !!component?.parentElement?.closest("[data-component], td, th") || !!el.closest("td, th");
	}, []);

	const getMaxWidth = useCallback(() => {
		const article = articleRef.current?.firstElementChild as HTMLElement;
		if (!article) return 0;
		return parseFloat(window.getComputedStyle(article).getPropertyValue(ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE));
	}, []);

	const handleResizeStart = useCallback((startX: number) => {
		const mainContainer = containerRef.current;
		startWidthRef.current = mainContainer.offsetWidth;
		startClientXRef.current = startX;
		const nodeViewWrapper = mainContainer.closest("[data-drag-handle]");
		if (!nodeViewWrapper) return;
		nodeViewWrapper.removeAttribute("data-drag-handle");
	}, []);

	const handleResizeMove = useCallback(
		(_deltaX: number, _deltaY: number, clientX: number) => {
			const object = containerRef.current;
			const container = getContainer();

			if (!object || !container) return;

			const currentHeight = object.offsetHeight;
			const newWidth = startWidthRef.current + (clientX - startClientXRef.current);
			const aspectRatio = startWidthRef.current / currentHeight;
			const newHeight = newWidth / aspectRatio;

			const isFloat = hasFloat();
			const nested = isNested();

			const articleMaxWidth = parseFloat(getComputedStyle(container).width);
			const minWidth = 2.5 * parseFloat(getComputedStyle(object).fontSize);
			const fullArticleWidth = isFloat || nested ? articleMaxWidth : getMaxWidth();

			const snapThreshold = parseFloat(getComputedStyle(document.documentElement).fontSize) * 2;
			const distanceToMax = Math.abs(newWidth - articleMaxWidth);
			const snappedToMax = distanceToMax < snapThreshold;
			const effectiveWidth = snappedToMax ? articleMaxWidth : newWidth;

			if (effectiveWidth >= fullArticleWidth) {
				object.style.width = `${fullArticleWidth}px`;
			} else if (newHeight <= minWidth || newWidth <= minWidth) {
				const adjustedWidth = minWidth * aspectRatio;
				object.style.width = `${adjustedWidth}px`;
			} else {
				object.style.width = `${effectiveWidth}px`;
			}

			setIsFullArticle(!nested && effectiveWidth > articleMaxWidth);
		},
		[getContainer, getMaxWidth, hasFloat, isNested],
	);

	const handleResizeEnd = useCallback(() => {
		const mainContainer = containerRef.current;
		const nodeViewWrapper = mainContainer.closest("[data-drag-handle]");
		if (nodeViewWrapper) {
			nodeViewWrapper.setAttribute("data-drag-handle", "true");
		}

		const object = containerRef.current;
		if (!object) return;

		const finalWidth = object.offsetWidth;
		onChange(`${finalWidth}px`);
	}, [onChange]);

	const { onPointerDown, onTouchStart, onMouseDown } = useTouchHandler({
		onStart: handleResizeStart,
		onMove: (deltaX, deltaY, clientX) => handleResizeMove(deltaX, deltaY, clientX),
		onEnd: handleResizeEnd,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		const currentScale = scale ?? defaultScale;

		const applyScale = (newScale: number | string) => {
			const component = containerRef.current;
			if (!component) return false;

			if (!newScale) {
				component.style.removeProperty("width");
				return true;
			}

			const container = getContainer();
			if (!container) return false;

			const articleMaxWidth = parseFloat(getComputedStyle(container).width);
			if (!articleMaxWidth) return false;

			const nested = isNested();
			const fullArticleWidth = nested ? articleMaxWidth : getMaxWidth() || articleMaxWidth;

			let width: number;
			if (typeof newScale === "string" && newScale.endsWith("px")) {
				width = parseFloat(newScale);
			} else {
				const scaleNum = typeof newScale === "string" ? parseFloat(newScale) : newScale;
				width =
					scaleNum <= 100
						? getScale(scaleNum, articleMaxWidth)
						: articleMaxWidth + ((scaleNum - 100) / 100) * (fullArticleWidth - articleMaxWidth);
			}

			width = Math.min(width, fullArticleWidth);

			setIsFullArticle(!nested && width > articleMaxWidth);
			component.style.width = `min(${width}px, var(${ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE}))`;
			return true;
		};

		const applied = applyScale(currentScale);

		const resize = () => {
			applyScale(currentScale);
		};

		window.addEventListener("resize", resize);

		const container = getContainer();
		let observer: ResizeObserver;
		if (container && (!applied || isNested())) {
			observer = new ResizeObserver(() => {
				if (!applyScale(currentScale)) return;
				observer.disconnect();
				observer = null;
			});
			observer.observe(container);
		}

		return () => {
			window.removeEventListener("resize", resize);
			observer?.disconnect();
		};
	}, [scale, defaultScale, getContainer, sidebarsIsPin]);

	const { resizer, container } = styles();
	return (
		<div
			className="flex"
			style={
				isFullArticle && !isPrint
					? {
							width: `var(${ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE})`,
							maxWidth: `var(${ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE})`,
							marginLeft: `calc((var(${ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE}) - 100%) / -2)`,
						}
					: undefined
			}
		>
			<div
				className={cn(className, container())}
				ref={containerRef}
				style={{ maxWidth: `var(${ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE})` }}
				{...rest}
			>
				{children}
				{!disabled && !isReadOnly && (
					<div
						aria-hidden={!selected}
						className={cn("resizer", resizer())}
						data-selected={selected}
						data-testid="component-resizer"
						onMouseDown={onMouseDown}
						onPointerDown={onPointerDown}
						onTouchStart={onTouchStart}
					/>
				)}
			</div>
		</div>
	);
};
