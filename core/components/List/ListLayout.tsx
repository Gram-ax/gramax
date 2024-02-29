import { classNames } from "@components/libs/classNames";
import { useOutsideClick } from "@core-ui/hooks/useOutsideClick";
import styled from "@emotion/styled";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useMemo } from "react";
import { ForwardedRef, MouseEventHandler } from "react";
import Tooltip from "../Atoms/Tooltip";
import { ListItem, ItemContent, ButtonItem } from "./Item";
import Items, { OnItemClick } from "./Items";
import Search, { SearchElement } from "./Search";

export interface ListLayoutElement extends HTMLDivElement {
	searchRef: SearchElement;
}

interface ConfigProps {
	openByDefault?: boolean;
	placeholder?: string;
	disable?: boolean;
	isCode?: boolean;
	errorText?: string;
	showErrorText?: boolean;
	hideScrollbar?: boolean;
	selectAllOnFocus?: boolean;
	disableSearch?: boolean;
	isLoadingData?: boolean;
}

interface ListLayoutProps extends ConfigProps {
	buttons?: ButtonItem[];
	items: ItemContent[];
	item?: ItemContent;
	icon?: string;
	maxItems?: number;
	tabIndex?: number;
	onSearchClick?: () => void;
	onSearchChange?: (value: string) => void;
	onItemClick?: (value: string, e: MouseEventHandler<HTMLDivElement> | KeyboardEvent, idx: number) => void;
	onFocus?: () => void;
	className?: string;
	itemsClassName?: string;
}

const StyledDiv = styled.div<ConfigProps>`
	width: 100%;
	border-radius: 4px 4px 0 0;
	pointer-events: ${(props) => (props.disable ? "none" : "auto")};
	color: ${(props) => (props.isCode ? "var(--color-prism-text)" : "inherit")};
`;

const filterItems = (items: (ListItem | string)[], input: string) => {
	const filter = (item: string): boolean => {
		if (input.endsWith(" ")) return item.endsWith(input.trim());
		return item.toLowerCase().includes(input.toLowerCase());
	};

	return items?.filter((item) => {
		if (typeof item === "string") return filter(item);
		if (typeof item?.element === "string") return filter(item.element);
		else return item?.labelField ? filter(item.labelField) : false;
	});
};

const getStrValue = (value: string | ListItem) => {
	return typeof value == "string" ? value : typeof value.element == "string" ? value.element : value.labelField;
};

const ListLayout = forwardRef((props: ListLayoutProps, ref: ForwardedRef<ListLayoutElement>) => {
	const { items = [], buttons = [], item = "" } = props;
	const { onSearchClick, onSearchChange, onItemClick, onFocus } = props;

	const {
		selectAllOnFocus = true,
		openByDefault = false,
		isLoadingData = false,
		disable = false,
		isCode = true,
	} = props;

	const {
		errorText,
		showErrorText = true,
		maxItems = 6,
		hideScrollbar,
		disableSearch,
		icon,
		tabIndex,
		placeholder,
		className,
		itemsClassName,
	} = props;

	const [filteredWidth, setFilteredWidth] = useState<number>();
	const [isOpen, setIsOpen] = useState<boolean>(openByDefault);
	const [value, setValue] = useState<ItemContent>(item);
	const listRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<SearchElement>(null);
	const itemsRef = useRef<HTMLDivElement>(null);

	useImperativeHandle(ref, () => ({
		get searchRef(): SearchElement {
			return searchRef.current;
		},
		get itemsRef(): HTMLDivElement {
			return itemsRef.current;
		},
		...listRef.current,
	}));

	useOutsideClick(
		[itemsRef?.current, searchRef?.current?.inputRef, searchRef?.current?.chevronRef],
		() => setIsOpen(false),
		true,
	);

	const filteredItems = useMemo(() => {
		return value ? filterItems(items, getStrValue(value)) : items || [];
	}, [value, items]);

	const focusInInput = () => {
		if (searchRef.current) searchRef.current.inputRef.focus();
	};

	const blurInInput = () => {
		if (searchRef.current) searchRef.current.inputRef.blur();
	};

	const selectInInput = () => {
		if (searchRef.current) searchRef.current.inputRef.select();
	};

	const itemClickHandler: OnItemClick = (value, e, idx) => {
		const index = items.indexOf(filteredItems[idx]);
		onItemClick?.(getStrValue(value), e, index !== -1 ? index : idx);
		setValue(value);
	};

	const setValueHandler = (v: string) => {
		if (typeof value == "string") return setValue(v);
		if (typeof value.element == "string") return setValue({ ...value, element: v });
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

	useEffect(() => {
		if (openByDefault) focusInInput();
	}, []);

	useEffect(() => {
		setValue(item);
	}, [item]);

	useEffect(() => {
		if (listRef?.current) setFilteredWidth(listRef.current.clientWidth);
	}, [listRef?.current]);

	const TooltipContent = (
		<div style={{ width: filteredWidth }} ref={itemsRef}>
			<Items
				setIsOpen={setIsOpen}
				buttons={buttons}
				isLoadingData={isLoadingData}
				value={getStrValue(value)}
				blurInInput={blurInInput}
				className={itemsClassName}
				isCode={isCode}
				filteredWidth={filteredWidth}
				maxItems={maxItems}
				hideScrollbar={hideScrollbar}
				items={filteredItems}
				onItemClick={itemClickHandler}
				isOpen={isOpen}
				searchRef={searchRef}
			/>
		</div>
	);

	return (
		<Tooltip
			arrow={false}
			distance={4}
			interactive
			customStyle
			place="bottom"
			trigger="click"
			visible={true}
			hideOnClick={false}
			hideInMobile={false}
			content={TooltipContent}
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
					ref={searchRef}
					icon={icon}
					isCode={isCode}
					isOpen={isOpen}
					tabIndex={tabIndex}
					disable={disableSearch}
					placeholder={placeholder}
					errorText={errorText}
					showErrorText={showErrorText}
					onFocus={onFocusHandler}
					onSearchChange={onSearchChange}
					onClick={onSearchClickHandler}
					onChevronClick={onChevronClickHandler}
				/>
			</StyledDiv>
		</Tooltip>
	);
});

export default ListLayout;
