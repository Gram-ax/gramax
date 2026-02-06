import { classNames } from "@components/libs/classNames";
import eventEmitter from "@core/utils/eventEmitter";
import { useOutsideClick } from "@core-ui/hooks/useOutsideClick";
import useWatch from "@core-ui/hooks/useWatch";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import styled from "@emotion/styled";
import { TippyProps } from "@tippyjs/react";
import {
	ForwardedRef,
	forwardRef,
	MouseEventHandler,
	MutableRefObject,
	useCallback,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Placement } from "tippy.js";
import Tooltip from "../Atoms/Tooltip";
import { ButtonItem, ItemContent } from "./Item";
import Items, { OnItemClick } from "./Items";
import Search, { SearchElement } from "./Search";

export interface ListLayoutElement {
	searchRef: SearchElement;
	itemsRef: HTMLDivElement;
	htmlElement: HTMLDivElement;
}

interface ConfigProps {
	disabledOutsideClick?: boolean;
	openByDefault?: boolean;
	placeholder?: string;
	dataQa?: string;
	disable?: boolean;
	isCode?: boolean;
	errorText?: string;
	showErrorText?: boolean;
	hideScrollbar?: boolean;
	customOutsideClick?: boolean;
	selectAllOnFocus?: boolean;
	isHierarchy?: boolean;
	withBreadcrumbs?: boolean;
	disableSearch?: boolean;
	keepFullWidth?: boolean;
	isLoadingData?: boolean;
	disableCancelAction?: boolean;
	place?: Placement;
	appendTo?: TippyProps["appendTo"];
}

export interface ListLayoutProps extends ConfigProps {
	buttons?: ButtonItem[];
	items: ItemContent[];
	item?: ItemContent;
	itemIndex?: number | null;
	icon?: string;
	maxItems?: number;
	provideCloseHandler?: (handler: (value: boolean) => void) => void;
	tabIndex?: number;
	onSearchClick?: () => void;
	onCancelClick?: () => void;
	onSearchChange?: (value: string) => void;
	onItemClick?: (
		labelField: string,
		mouseEvent: MouseEventHandler<HTMLDivElement> | KeyboardEvent,
		idx: number,
	) => void;
	onFocus?: () => void;
	className?: string;
	itemsClassName?: string;
	filterItems?: (items: ItemContent[], input: string) => ItemContent[];
	containerRef?: MutableRefObject<any>;
	addWidth?: number;
	useVirtuoso?: boolean;
}

const StyledDiv = styled.div<ConfigProps>`
	width: 100%;
	pointer-events: ${(props) => (props.disable ? "none" : "auto")};
	color: ${(props) => (props.isCode ? "var(--color-prism-text)" : "inherit")};
`;

export const filter = (input: string) => {
	return (value: string) => value.toLowerCase().includes(input.toLowerCase());
};

const defaultFilterItems = (items: ItemContent[], input: string) => {
	const filterItems = (input: string) => {
		const currentFilter = filter(input);

		const result = items?.filter((item) => {
			if (typeof item === "string") return currentFilter(item);
			if (typeof item?.element === "string") return currentFilter(item.element);
			if (item?.loading) return !input;
			return item?.labelField ? currentFilter(item.labelField) : false;
		});

		return result.length > 0 ? result : null;
	};

	return multiLayoutSearcher<ItemContent[]>({
		sync: true,
		searcher: filterItems,
	})(input);
};

const getBreadcrumb = (item: ItemContent) => {
	if (!item || typeof item === "string") return undefined;
	if (!("breadcrumb" in item)) return undefined;
	return item.breadcrumb;
};

const breadcrumbFilter = (items: ItemContent[]) => {
	if (!items) return items;

	for (let i = items.length - 1; i >= 0; i--) {
		const item = items[i];
		if (!item || typeof item === "string" || !("breadcrumb" in item)) continue;
		const breadcrumb = getBreadcrumb(item);
		const nextBreadcrumb = getBreadcrumb(items[i - 1]);

		if (breadcrumb?.join("") === nextBreadcrumb?.join("")) delete item.breadcrumb;
	}

	return items;
};

const getStrValue = (value: ItemContent) => {
	return typeof value == "string" ? value : typeof value.element == "string" ? value.element : value.labelField;
};

const ListLayout = forwardRef((props: ListLayoutProps, ref: ForwardedRef<ListLayoutElement>) => {
	const { items = [], buttons = [], item = "", filterItems = defaultFilterItems } = props;
	const { onSearchClick, onSearchChange, onItemClick, onFocus, onCancelClick } = props;

	const {
		disabledOutsideClick = false,
		selectAllOnFocus = true,
		openByDefault = false,
		isHierarchy = false,
		withBreadcrumbs = false,
		customOutsideClick = false,
		isLoadingData = false,
		disable = false,
		isCode = true,
		disableCancelAction = false,
		place = "bottom",
		appendTo,
		useVirtuoso = true,
	} = props;

	const {
		errorText,
		showErrorText = true,
		maxItems = 6,
		hideScrollbar,
		itemIndex,
		disableSearch,
		icon,
		tabIndex,
		placeholder,
		dataQa,
		className,
		itemsClassName,
		containerRef,
		addWidth = 0,
		keepFullWidth = false,
		provideCloseHandler,
	} = props;

	const [selectedItem, setSelectedItem] = useState<ItemContent>("");
	const [filteredWidth, setFilteredWidth] = useState<number>();
	const [isOpen, setIsOpen] = useState<boolean>(openByDefault);
	const [value, setValue] = useState<ItemContent>(item);
	const listRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<SearchElement>(null);
	const itemsRef = useRef<HTMLDivElement>(null);
	const [showFilteredItems, setShowFilteredItems] = useState(false);

	useImperativeHandle(ref, () => ({
		get searchRef(): SearchElement {
			return searchRef.current;
		},
		get itemsRef(): HTMLDivElement {
			return itemsRef.current;
		},
		get htmlElement(): HTMLDivElement {
			return listRef.current;
		},
	}));

	useOutsideClick<HTMLDivElement | HTMLInputElement>(
		[itemsRef.current, searchRef.current?.inputRef, searchRef.current?.chevronRef],
		(e) => {
			const secondCallback = () => setValue(item !== "" ? item : selectedItem);

			if (!customOutsideClick) {
				secondCallback();
				return setIsOpen(false);
			}

			if (!(eventEmitter.listeners("ListLayoutOutsideClick").length > 0)) {
				secondCallback();
				return setIsOpen(false);
			}

			const callback = () => {
				secondCallback();
				setIsOpen(false);
			};

			eventEmitter.emit("ListLayoutOutsideClick", { e, callback });
		},
		!disabledOutsideClick,
	);

	useEffect(() => {
		provideCloseHandler?.(() => setIsOpen);
	}, [provideCloseHandler]);

	const filteredItems = useMemo(() => {
		const result = filterItems(items, getStrValue(value));
		if (withBreadcrumbs) breadcrumbFilter(result);
		return result;
	}, [value, items, withBreadcrumbs]);

	useWatch(() => {
		if (isOpen && getStrValue(selectedItem) == getStrValue(value)) setShowFilteredItems(false);
	}, [isOpen]);

	const focusInInput = () => {
		if (searchRef.current) searchRef.current.inputRef.focus();
	};

	const blurInInput = useCallback(() => {
		if (searchRef.current) searchRef.current.inputRef.blur();
	}, []);

	const selectInInput = () => {
		if (searchRef.current) searchRef.current.inputRef.select();
	};

	const itemClickHandler: OnItemClick = useCallback(
		(value, e, idx) => {
			const index = showFilteredItems ? items.indexOf(filteredItems[idx]) : idx;
			onItemClick?.(getStrValue(value), e, index !== -1 ? index : idx);
			setSelectedItem(value);
			setValue(value);
		},
		[items, showFilteredItems, filteredItems, onItemClick],
	);

	const setValueHandler = (v: string) => {
		setShowFilteredItems(Boolean(v));
		if (typeof value === "string") return setValue(v);
		if (typeof value.element === "string") return setValue({ ...value, element: v });
		return setValue({ ...value, labelField: v });
	};

	const onSearchClickHandler = () => {
		onSearchClick?.();
		setIsOpen(true);
	};

	const onChevronClickHandler = () => {
		setIsOpen(!isOpen);
	};

	const onFocusHandler = () => {
		if (selectAllOnFocus) selectInInput();
		onFocus?.();
	};

	const TooltipContent = (
		<div ref={itemsRef} style={{ width: filteredWidth }}>
			<Items
				blurInInput={blurInInput}
				buttons={buttons}
				className={itemsClassName}
				filteredItems={filteredItems}
				filteredWidth={filteredWidth}
				hideScrollbar={hideScrollbar}
				isCode={isCode}
				isHierarchy={isHierarchy}
				isLoadingData={isLoadingData}
				isOpen={isOpen}
				itemIndex={itemIndex}
				items={items}
				keepFullWidth={keepFullWidth}
				maxItems={maxItems}
				onItemClick={itemClickHandler}
				searchRef={searchRef}
				setIsOpen={setIsOpen}
				showFilteredItems={showFilteredItems}
				useVirtuoso={useVirtuoso}
				value={getStrValue(value)}
				withBreadcrumbs={withBreadcrumbs}
			/>
		</div>
	);

	useEffect(() => {
		if (openByDefault) focusInInput();
	}, []);

	useEffect(() => {
		setValue(item);
	}, [item]);

	useLayoutEffect(() => {
		const width = containerRef?.current?.clientWidth;
		setFilteredWidth(width ? width + addWidth : listRef.current?.clientWidth);
	}, [listRef.current?.clientWidth, containerRef?.current?.clientWidth]);

	return (
		<Tooltip
			appendTo={appendTo}
			arrow={false}
			content={TooltipContent}
			customStyle
			hideInMobile={false}
			hideOnClick={false}
			interactive
			offset={(p) => (p.placement == "top" ? [0, 7] : [0, 3])}
			place={place}
			trigger="click"
			visible
		>
			<StyledDiv
				className={classNames("list-layout", { active: isOpen }, [className])}
				data-qa="list"
				disable={disable}
				isCode={isCode}
				ref={listRef}
			>
				<Search
					data-qa={dataQa}
					disable={disableSearch}
					disableCancelAction={disableCancelAction}
					errorText={errorText}
					icon={icon}
					isCode={isCode}
					isOpen={isOpen}
					onCancelClick={onCancelClick}
					onChevronClick={onChevronClickHandler}
					onClick={onSearchClickHandler}
					onFocus={onFocusHandler}
					onSearchChange={onSearchChange}
					placeholder={placeholder}
					ref={searchRef}
					setIsOpen={setIsOpen}
					setValue={setValueHandler}
					showErrorText={showErrorText}
					tabIndex={tabIndex}
					title={getStrValue(value)}
					value={getStrValue(value)}
				/>
			</StyledDiv>
		</Tooltip>
	);
});

export default ListLayout;
