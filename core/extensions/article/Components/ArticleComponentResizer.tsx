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
	useEffect,
	useRef,
	useState,
} from "react";
import { tv } from "tailwind-variants";

interface ArticleComponentResizerProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
	selected?: boolean;
	scale?: number | string;
	children?: ReactNode;
	disabled?: boolean;
	onChange?: (resize: string) => void;
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
	const { className, scale, selected = false, onChange, children, disabled, ...rest } = props;
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

	const getMaxWidth = useCallback(() => {
		const article = articleRef.current?.firstElementChild as HTMLElement;
		if (!article) return 0;
		return parseFloat(window.getComputedStyle(article).getPropertyValue(ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE));
	}, [articleRef]);

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

			const articleMaxWidth = parseFloat(getComputedStyle(container).width);
			const minWidth = 2.5 * parseFloat(getComputedStyle(object).fontSize);
			const fullArticleWidth = isFloat ? articleMaxWidth : getMaxWidth();

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

			setIsFullArticle(effectiveWidth > articleMaxWidth);
		},
		[getContainer, getMaxWidth, hasFloat],
	);

	const handleResizeEnd = useCallback(() => {
		const mainContainer = containerRef.current;
		const nodeViewWrapper = mainContainer.closest("[data-drag-handle]");
		if (nodeViewWrapper) {
			nodeViewWrapper.setAttribute("data-drag-handle", "true");
		}

		const object = containerRef.current;
		if (!object) return;

		const containerWidth = parseFloat(getComputedStyle(getContainer()).width);
		const finalWidth = object.offsetWidth;

		if (finalWidth > containerWidth) {
			onChange(`${finalWidth}px`);
		} else {
			onChange(String(Math.round((finalWidth / containerWidth) * 100)));
		}
	}, [getContainer, onChange]);

	const { onPointerDown, onTouchStart, onMouseDown } = useTouchHandler({
		onStart: handleResizeStart,
		onMove: (deltaX, deltaY, clientX) => handleResizeMove(deltaX, deltaY, clientX),
		onEnd: handleResizeEnd,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		const applyScale = (newScale: number | string) => {
			const component = containerRef.current;
			if (!component) return;

			if (!newScale) {
				component.style.removeProperty("width");
				return;
			}

			const container = getContainer();
			if (!container) return;

			const articleMaxWidth = parseFloat(getComputedStyle(container).width);

			let width: number;
			if (typeof newScale === "string" && newScale.endsWith("px")) {
				width = parseFloat(newScale);
			} else {
				const scaleNum = typeof newScale === "string" ? parseFloat(newScale) : newScale;
				const fullArticleWidth = getMaxWidth();
				width =
					scaleNum <= 100
						? getScale(scaleNum, articleMaxWidth)
						: articleMaxWidth + ((scaleNum - 100) / 100) * (fullArticleWidth - articleMaxWidth);
			}

			if (width > articleMaxWidth) setIsFullArticle(true);
			component.style.width = `${width}px`;
		};

		applyScale(scale);

		const resize = () => {
			applyScale(scale);
		};

		window.addEventListener("resize", resize);

		return () => {
			window.removeEventListener("resize", resize);
		};
	}, [scale, getContainer, sidebarsIsPin]);

	const { resizer, container } = styles();
	return (
		<div
			className="flex"
			style={
				isFullArticle
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
