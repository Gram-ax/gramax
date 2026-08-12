import ShadowBox from "@components/WidthWrapper/ShadowBox";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import useShowMainLangContentPreview from "@core-ui/hooks/useShowMainLangContentPreview";
import { cn } from "@core-ui/utils/cn";
import { useIsDoublePanel } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useIsDiffView } from "@ext/git/core/Diff/logic/hooks/useIsDiffView";
import { VERTICAL_TOP_OFFSET } from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import { CELL_MIN_WIDTH, PADDING_TOP_BOTTOM } from "@ext/markdown/elements/table/render/components/TableWrapper";
import {
	type ComponentProps,
	type CSSProperties,
	type RefObject,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

export interface WidthWrapperProps {
	children: JSX.Element;
	additional?: JSX.Element;
	"data-wrapper"?: string;
	tableRef?: RefObject<HTMLTableElement>;
	disableWrapper?: boolean;
	shadowBoxLeftProps?: ComponentProps<typeof ShadowBox>;
}

const WidthWrapper = (props: WidthWrapperProps) => {
	const {
		children,
		"data-wrapper": dataWrapper,
		disableWrapper: disableWrapperProp,
		additional,
		shadowBoxLeftProps = {},
	} = props;
	const [rightWidth, setRightWidth] = useState(0);
	const [leftWidth, setLeftWidth] = useState(0);
	const [height, setHeight] = useState(0);

	const isShowMainLangContentPreview = useShowMainLangContentPreview();
	const isDoublePanel = useIsDoublePanel();
	const isDiffView = useIsDiffView();
	const disableWrapper = disableWrapperProp || isShowMainLangContentPreview || (isDiffView && isDoublePanel);

	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const isPin = SidebarsIsPinService.value.left;
	const leftNavigation = SidebarsIsOpenService?.transitionEndIsLeftOpen;

	const setWidth = useCallback(() => {
		const scroll = scrollContainerRef.current;

		if (scroll?.firstElementChild) {
			const containerRect = scroll.getBoundingClientRect();
			const childRect = scroll.firstElementChild.getBoundingClientRect();

			setLeftWidth(containerRect.left - childRect.left);
			setRightWidth(childRect.right - containerRect.right);
		}
	}, []);

	const resizeWrapper = useCallback(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		setHeight(scrollContainer.clientHeight);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		if (!scrollContainerRef.current) return;

		const handleResize = () => {
			setWidth();
			resizeWrapper();
		};

		const observer = new ResizeObserver(handleResize);
		observer.observe(scrollContainerRef.current.firstElementChild);

		window.addEventListener("resize", handleResize);

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", handleResize);
		};
	}, [setWidth, resizeWrapper, scrollContainerRef.current]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		resizeWrapper();
		setWidth();
	}, [setWidth, isPin, leftNavigation]);

	return (
		<div className={cn("width-wrapper-container", "flex justify-center", "print:justify-start print:ml-0")}>
			<div
				className={cn(
					"width-wrapper",
					"relative z-0",
					"max-w-[max(calc(var(--article-content-wrapper-width)+3em),100%)]",
					"[&:has(.scrollableContent>div[data-table-wrapper])]:pb-[calc(var(--padding-top-bottom)-var(--vertical-top-offset))]",
					"[&:has(.scrollableContent>div[data-table-wrapper])_.scrollableContent>div[data-table-wrapper]]:pb-[var(--vertical-top-offset)]",
					disableWrapper && "w-full",
				)}
				data-wrapper={dataWrapper}
				style={
					{
						"--padding-top-bottom": PADDING_TOP_BOTTOM,
						"--vertical-top-offset": VERTICAL_TOP_OFFSET,
						"--cell-min-width": CELL_MIN_WIDTH,
					} as CSSProperties
				}
			>
				<div
					className={cn(
						"scrollableContent",
						"overflow-x-auto overflow-y-hidden relative",

						// ColGroup sets --table-width when every column has an explicit width
						"[&.scrollableContent_table]:w-[var(--table-width,max-content)]",
						"[&.scrollableContent_table]:max-w-none",
						"[&_table_th]:min-w-[var(--cell-min-width)]",
						"[&_table_td]:min-w-[var(--cell-min-width)]",

						"print:[&.scrollableContent_table]:w-full",
						"print:[&.scrollableContent_table]:max-w-full",
						"print:[&_table_th]:min-w-0",
						"print:[&_table_td]:min-w-0",

						"print:[&_table]:w-auto",
						"print:[&_table_th]:page-break-inside-avoid",
						"print:[&_table_td]:page-break-inside-avoid",
						"print:[&_table_colgroup]:hidden",
					)}
					onScroll={setWidth}
					ref={scrollContainerRef}
				>
					{children}
				</div>
				{additional}
				<ShadowBox direction="left" height={height} width={leftWidth} {...shadowBoxLeftProps} />
				<ShadowBox direction="right" height={height} width={rightWidth} />
			</div>
		</div>
	);
};

export default WidthWrapper;
