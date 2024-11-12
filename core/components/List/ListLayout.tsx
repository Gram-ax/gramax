import { classNames } from "@components/libs/classNames";
import { useOutsideClick } from "@core-ui/hooks/useOutsideClick";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import eventEmitter from "@core/utils/eventEmmiter";
import styled from "@emotion/styled";
import { TippyProps } from "@tippyjs/react";
import {
	ForwardedRef,
	forwardRef,
	MouseEventHandler,
	MutableRefObject,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
	useMemo,
	useCallback,
	useLayoutEffect,
} from "react";
import { Placement } from "tippy.js";
import Tooltip from "../Atoms/Tooltip";
import { ButtonItem, ItemContent } from "./Item";
import Items, { OnItemClick } from "./Items";
import Search, { SearchElement } from "./Search";
import useWatch from "@core-ui/hooks/useWatch";

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

	return multiLayoutSearcher<ItemContent[]>(filterItems, true)(input);
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

	const filteredItems = useMemo(() => filterItems(items, getStrValue(value)), [value, items]);

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
		<div style={{ width: filteredWidth }} ref={itemsRef}>
			<Items
				setIsOpen={setIsOpen}
				buttons={buttons}
				isLoadingData={isLoadingData}
				isHierarchy={isHierarchy}
				withBreadcrumbs={withBreadcrumbs}
				value={getStrValue(value)}
				filteredWidth={filteredWidth}
				blurInInput={blurInInput}
				className={itemsClassName}
				isCode={isCode}
				maxItems={maxItems}
				hideScrollbar={hideScrollbar}
				itemIndex={itemIndex}
				items={items}
				filteredItems={filteredItems}
				showFilteredItems={showFilteredItems}
				onItemClick={itemClickHandler}
				isOpen={isOpen}
				searchRef={searchRef}
				keepFullWidth={keepFullWidth}
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
			content={TooltipContent}
			appendTo={appendTo}
			place={place}
			trigger="click"
			offset={(p) => (p.placement == "top" ? [0, 7] : [0, 3])}
			hideInMobile={false}
			hideOnClick={false}
			interactive
			customStyle
			arrow={false}
			visible
		>
			<StyledDiv
				disable={disable}
				isCode={isCode}
				data-qa="list"
				ref={listRef}
				className={classNames("list-layout", {}, [className])}
			>
				<Search
					title={getStrValue(value)}
					value={getStrValue(value)}
					setValue={setValueHandler}
					setIsOpen={setIsOpen}
					ref={searchRef}
					icon={icon}
					isCode={isCode}
					disableCancelAction={disableCancelAction}
					isOpen={isOpen}
					tabIndex={tabIndex}
					disable={disableSearch}
					placeholder={placeholder}
					errorText={errorText}
					showErrorText={showErrorText}
					onFocus={onFocusHandler}
					onSearchChange={onSearchChange}
					onClick={onSearchClickHandler}
					onCancelClick={onCancelClick}
					onChevronClick={onChevronClickHandler}
					data-qa={dataQa}
				/>
			</StyledDiv>
		</Tooltip>
	);
});

export default ListLayout;
