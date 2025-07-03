import { parseButton } from "@components/List/ButtonItem";
import ItemByUikit from "@components/List/ItemByUikit";
import LoadingListItem from "@components/List/LoadingListItem";
import { SearchElement } from "@components/List/Search";
import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import {
	HTMLAttributes,
	MouseEventHandler,
	MutableRefObject,
	ReactNode,
	forwardRef,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import Tooltip from "@components/Atoms/Tooltip";
import RequestValueNotFound from "@components/List/RequestValueNotFound";
import scrollUtils from "@core-ui/utils/scrollUtils";
import ErrorHandler from "@ext/errorHandlers/client/components/ErrorHandler";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { ButtonItem, ItemContent, ListItem } from "./Item";

export type OnItemClick = (
	value: string | ListItem,
	e: MouseEventHandler<HTMLDivElement> | KeyboardEvent,
	idx: number,
) => void;

interface ConfigProps {
	isOpen?: boolean;
	isCode?: boolean;
	isLoadingData?: boolean;
	hideScrollbar?: boolean;
	isHierarchy?: boolean;
	withBreadcrumbs?: boolean;
	maxItems?: number;
	filteredWidth: number;
}

interface ItemsProps extends HTMLAttributes<HTMLDivElement>, ConfigProps {
	items: ItemContent[];
	filteredItems?: ItemContent[];
	setIsOpen: (v: boolean) => void;
	itemIndex?: null | number;
	buttons?: ButtonItem[];
	isHierarchy?: boolean;
	value: string;
	showFilteredItems?: boolean;
	searchRef?: MutableRefObject<SearchElement>;
	blurInInput: () => void;
	onItemClick?: OnItemClick;
	keepFullWidth?: boolean;
	useVirtuoso?: boolean;
	endReached?: () => void;
}

const getArray = <T,>(array: T[]): T[] => (!Array.isArray(array) || !array.length ? [] : array);

const Items = memo((props: ItemsProps) => {
	const {
		items: propsItems,
		buttons = [],
		itemIndex,
		onItemClick,
		isOpen,
		setIsOpen,
		filteredItems,
		isHierarchy,
		withBreadcrumbs,
		blurInInput,
		searchRef = { current: null },
		className,
		value,
		maxItems = 6,
		filteredWidth,
		isLoadingData,
		showFilteredItems,
		keepFullWidth,
		useVirtuoso: hasVirtuoso,
		endReached,
		...otherProps
	} = props;

	const ref = useRef<HTMLDivElement>(null);
	const focusRef = useRef<HTMLDivElement>(null);
	const [isReadyToScroll, setIsReadyToScroll] = useState(false);
	const [activeIdx, setActiveIdx] = useState<number>(0);

	const items = useMemo(() => {
		return showFilteredItems ? filteredItems : propsItems;
	}, [showFilteredItems, filteredItems, propsItems]);

	const itemsWithButtons = useMemo(() => {
		return [...getArray(buttons), ...getArray(items)];
	}, [buttons, items]);

	const useVirtuoso = hasVirtuoso && itemsWithButtons.length > maxItems;
	const virtuosoRef = useRef<VirtuosoHandle>(null);

	let scrollTop: number;

	virtuosoRef.current?.getState((e) => {
		scrollTop = e.scrollTop;
	});

	useEffect(() => {
		if (!scrollTop || !virtuosoRef.current) return;
		virtuosoRef.current.scrollTo({ top: scrollTop });
	}, [items]);

	const applyIndex = useCallback(
		(newIndex: number, align?: "center" | "end" | "start", behavior: "auto" | "smooth" = "auto") => {
			setActiveIdx(newIndex);
			virtuosoRef.current?.scrollIntoView({
				index: newIndex,
				align,
				behavior,
			});
		},
		[setActiveIdx],
	);

	const moveActiveIdx = useCallback(
		(n: number, align?: "center" | "end" | "start") => {
			const isNextLarger = n > 0;
			const getNewIndex = () => {
				let newIndex = activeIdx + n;
				if (newIndex < 0) newIndex = 0;
				else if (newIndex >= itemsWithButtons.length) newIndex = itemsWithButtons.length - 1;
				const newViewIndex = newIndex;
				while ((itemsWithButtons[newIndex] as ListItem)?.isTitle) {
					if (newIndex === 0 || newIndex === itemsWithButtons.length - 1)
						!isNextLarger ? newIndex++ : newIndex--;
					else isNextLarger ? newIndex++ : newIndex--;
				}

				return { newIndex, newViewIndex };
			};

			const { newIndex, newViewIndex } = getNewIndex();

			applyIndex(newIndex === activeIdx ? newViewIndex : newIndex, align);
		},
		[itemsWithButtons.length, activeIdx],
	);

	const handleMouseMove: MouseEventHandler<HTMLDivElement> = useCallback(
		(e) => {
			const menuItems = ref?.current?.children;
			for (let i = 0; i < menuItems.length; i++) {
				const htmlItem = menuItems[i] as HTMLElement;
				if (htmlItem.contains(e.target as Node)) {
					const absoluteIdx = +(htmlItem.dataset.index ?? i);
					const item = items?.[absoluteIdx];
					if (item && typeof item !== "string" && (item.disable || item.loading)) continue;
					setActiveIdx(absoluteIdx);
					break;
				}
			}
		},
		[items],
	);

	const itemClickHandler = useCallback(
		({ item, e, idx }) => {
			onItemClick(item, e, idx);
		},
		[onItemClick],
	);

	const keydownHandler = useCallback(
		(e: KeyboardEvent) => {
			const action = {
				PageDown: () => moveActiveIdx(maxItems),
				PageUp: () => moveActiveIdx(-maxItems),
				ArrowUp: () => moveActiveIdx(-1),
				ArrowDown: () => moveActiveIdx(1),
				Enter: () => focusRef.current.click(),
				Escape: () => {
					blurInInput();
					setIsOpen(false);
				},
			}[e.key];

			if (action) {
				if (focusRef.current) {
					e.preventDefault();
					action();
				}
			}
		},
		[moveActiveIdx, maxItems, blurInInput],
	);

	useWatch(() => {
		moveActiveIdx(-activeIdx);
	}, [value]);

	useEffect(() => {
		const element = searchRef.current?.inputRef ?? document;
		element.addEventListener("keydown", keydownHandler);

		return () => element.removeEventListener("keydown", keydownHandler);
	}, [keydownHandler, searchRef]);

	const itemContent = (idx: number) => {
		const button = buttons[idx];
		const isLastButton = !(buttons.length - 1 - idx);

		if (idx < buttons.length) {
			return (
				<ItemByUikit
					key={idx}
					content={parseButton({ ...button, isLastButton })}
					onClick={() => {
						setIsOpen(false);
						blurInInput();
						return button.onClick();
					}}
					ref={idx === activeIdx ? focusRef : null}
					isActive={idx === activeIdx}
					disable={typeof button === "string" ? null : button?.disable}
				/>
			);
		}

		const itemIndex = idx - buttons.length;
		const item = items[itemIndex];

		const tooltipDisabledContent =
			typeof item !== "string" && item.disable ? item.tooltipDisabledContent : undefined;

		const isLoading = typeof item !== "string" && item.loading === true;

		return (
			<Tooltip content={tooltipDisabledContent} key={idx}>
				<ItemByUikit
					key={idx}
					className={classNames("", {
						"disable-with-tooltip": !!tooltipDisabledContent,
					})}
					isHierarchy={isHierarchy}
					withBreadcrumbs={withBreadcrumbs}
					showFilteredItems={showFilteredItems}
					content={item}
					onClick={(e) => {
						itemClickHandler({ item, e, idx: itemIndex });
						setIsOpen(false);
						blurInInput();
					}}
					ref={idx === activeIdx ? focusRef : null}
					isActive={!isLoading && (typeof item === "string" || !item.isTitle) && idx === activeIdx}
					disable={isLoading || (typeof item !== "string" && item?.disable)}
					isLoading={isLoading}
				/>
			</Tooltip>
		);
	};

	useWatch(() => {
		if (itemIndex && isReadyToScroll) {
			const item = items[itemIndex];
			const indexToMove = itemsWithButtons.indexOf(item);

			applyIndex(indexToMove, "start");
		}
	}, [isReadyToScroll]);

	return (
		<StyleDiv
			ref={!useVirtuoso ? ref : null}
			maxItems={maxItems}
			onMouseMove={handleMouseMove}
			className={classNames("items", {}, [className])}
			isOpen={isOpen}
			filteredWidth={filteredWidth}
			onScroll={(e) => {
				if (useVirtuoso) return;
				props.onScroll?.(e);
				const isBottom = scrollUtils.scrollPositionIsBottom(e.target as HTMLDivElement, 32);
				if (isBottom) endReached();
			}}
			{...otherProps}
		>
			{!useVirtuoso ? (
				itemsWithButtons.map((_, idx) => itemContent(idx))
			) : (
				<StyledVirtuoso height={maxItems * 32} width={filteredWidth} keepFullWidth={keepFullWidth}>
					<ErrorHandler>
						<Virtuoso
							endReached={endReached}
							ref={virtuosoRef}
							totalCount={itemsWithButtons.length}
							itemsRendered={(items) => {
								if (items.length && !isReadyToScroll) setIsReadyToScroll(true);
							}}
							components={{
								List: forwardRef((props: any, listRef) => {
									const { children, ...rest } = props;
									return (
										<div
											ref={(el) => {
												if (typeof listRef === "function") {
													listRef(el);
												}
												ref.current = el;
											}}
											{...rest}
										>
											{children}
										</div>
									);
								}),
							}}
							itemContent={itemContent}
						/>
					</ErrorHandler>
				</StyledVirtuoso>
			)}
			{!getArray(items).length && (
				<>
					{isLoadingData && <ItemByUikit content={LoadingListItem} />}
					{value && !isLoadingData && <RequestValueNotFound />}
				</>
			)}
		</StyleDiv>
	);
});

export default Items;

const StyleDiv = styled.div<ConfigProps>`
	z-index: var(--z-index-foreground);
	width: calc(100% +2px);
	margin-left: -1px;
	border-radius: var(--radius);
	box-shadow: var(--shadows-deeplight);
	${(p) => (p.isOpen ? `max-height: ${p.maxItems * 32 + 8 + 2}px;` : "height: 0px;")}
	background-color: hsl(var(--secondary-bg));
	${(p) =>
		p.isOpen
			? `
  	padding: 0.25rem;
	border: 1px solid hsl(var(--border));
	`
			: ""}

	overflow: hidden;

	.disable-with-tooltip {
		pointer-events: all !important;
		cursor: default;
		opacity: 0.4;
	}
`;

interface StyledVirtuosoProps {
	height: number;
	width: number;
	children: ReactNode;
	className?: string;
	keepFullWidth: boolean;
}

const StyledVirtuoso = styled(({ children, className }: StyledVirtuosoProps) => {
	return <div className={className}>{children}</div>;
})`
	height: ${(p) => p.height}px;
	${(p) =>
		p.keepFullWidth &&
		`
	[data-testid="virtuoso-scroller"] {
		overflow-x: hidden;
	}
	[data-viewport-type="element"] {
		width: ${p.width}px !important;
	}`}
`;
