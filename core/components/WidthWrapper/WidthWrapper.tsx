import { ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE } from "@components/Layouts/CatalogLayout/ArticleLayout/consts";
import { classNames } from "@components/libs/classNames";
import ShadowBox from "@components/WidthWrapper/ShadowBox";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import useShowMainLangContentPreview from "@core-ui/hooks/useShowMainLangContentPreview";
import styled from "@emotion/styled";
import { VERTICAL_TOP_OFFSET } from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import { CELL_MIN_WIDTH, PADDING_TOP_BOTTOM } from "@ext/markdown/elements/table/render/components/TableWrapper";
import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from "react";

export interface WidthWrapperProps {
	children: JSX.Element;
	additional?: JSX.Element;
	className?: string;
	"data-wrapper"?: string;
	tableRef?: RefObject<HTMLTableElement>;
	disableWrapper?: boolean;
}

const WidthWrapper = (props: WidthWrapperProps) => {
	const { children, className, "data-wrapper": dataWrapper, disableWrapper, additional } = props;
	const [rightWidth, setRightWidth] = useState(0);
	const [leftWidth, setLeftWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const isShowMainLangContentPreview = useShowMainLangContentPreview();
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
		<div className={classNames(className, {}, ["width-wrapper-container"])}>
			<div
				className={classNames("width-wrapper", {
					"disable-wrapper": disableWrapper || isShowMainLangContentPreview,
				})}
				data-wrapper={dataWrapper}
			>
				<div className={"scrollableContent"} onScroll={setWidth} ref={scrollContainerRef}>
					{children}
				</div>
				{additional}
				<ShadowBox direction="left" height={height} width={leftWidth} />
				<ShadowBox direction="right" height={height} width={rightWidth} />
			</div>
		</div>
	);
};

export default styled(WidthWrapper)`
    display: flex;
    justify-content: center;

    .width-wrapper {
    	position: relative;
    	z-index: 0;

    	&:has(.scrollableContent > div[data-table-wrapper]) {
    		padding-bottom: calc(${PADDING_TOP_BOTTOM} - ${VERTICAL_TOP_OFFSET});
    		.scrollableContent > div[data-table-wrapper] {
    			padding-bottom: ${VERTICAL_TOP_OFFSET}	;
    		}
    	}

        max-width: max(calc(var(${ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE}) + 3em), 100%);
        &.disable-wrapper {
            width: 100%;
        }

  		.scrollableContent {
 			overflow-x: auto;
 			overflow-y: hidden;
 			position: relative;
  		}
    }

	@media not print {
		table {
			width: max-content;
			max-width: none;

			th,
			td {
				min-width: ${CELL_MIN_WIDTH};
			}
		}
	}

	@media print {
		margin-left: 0 !important;
		width: auto !important;
		justify-content: unset !important;

		table td,
		table th {
			page-break-inside: avoid;
		}
		table colgroup {
			display: none;
		}
	}
`;
