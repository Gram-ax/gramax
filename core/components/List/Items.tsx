import { parseButton } from "@components/List/ButtonItem";
import LoadingListItem from "@components/List/LoadingListItem";
import { SearchElement } from "@components/List/Search";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import {
	HTMLAttributes,
	MouseEventHandler,
	MutableRefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import Item, { ButtonItem, ItemContent, ListItem } from "./Item";

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
	maxItems?: number;
	filteredWidth: number;
}

interface ItemsProps extends HTMLAttributes<HTMLDivElement>, ConfigProps {
	items: ItemContent[];
	setIsOpen: (v: boolean) => void;
	buttons?: ButtonItem[];
	value: string;
	searchRef?: MutableRefObject<SearchElement>;
	blurInInput: () => void;
	onItemClick?: OnItemClick;
}

const StyleDiv = styled.div<ConfigProps>`
	z-index: 1;
	width: 100%;
	border-radius: 4px;
	box-shadow: var(--shadows-deeplight);
	background: var(--color-code-copy-bg);
	${(p) => (p.isCode ? "" : "left: 5.5px;")}
	${(p) => `max-width: ${p.filteredWidth ?? 0}px;`}
	${(p) => (p.isOpen ? `max-height: ${p.maxItems * 32}px;` : "height: 0px;")}
	overflow: ${(p) => (p.hideScrollbar ? "hidden" : "auto")};
`;

const Items = (props: ItemsProps) => {
	const {
		items,
		buttons,
		onItemClick,
		setIsOpen,
		blurInInput,
		searchRef,
		className,
		value,
		maxItems = 6,
		isLoadingData,
		...otherProps
	} = props;

	const ref = useRef<HTMLDivElement>(null);
	const focusRef = useRef<HTMLDivElement>(null);

	const [activeIdx, setActiveIdx] = useState<number>(0);
	const [scrollIntoViewBehavior, setScrollIntoViewBehavior] = useState<ScrollBehavior>("smooth");

	const getArray = (array: unknown) => (!Array.isArray(array) || !array.length ? [] : array);

	const itemsWithButtons = useMemo(() => {
		return [...getArray(buttons), ...getArray(items)];
	}, [buttons, items]);

	const moveActiveIdx = useCallback(
		(n: number) => {
			setActiveIdx((prevActiveIdx) => {
				let newIndex = prevActiveIdx + n;
				if (newIndex < 0) newIndex = 0;
				else if (newIndex >= itemsWithButtons.length) newIndex = itemsWithButtons.length - 1;
				return newIndex;
			});

			setTimeout(() => {
				focusRef.current?.scrollIntoView({ behavior: scrollIntoViewBehavior, block: n > 0 ? "start" : "end" });
			});
		},
		[itemsWithButtons.length, scrollIntoViewBehavior],
	);

	useEffect(() => {
		moveActiveIdx(-activeIdx);
	}, [buttons, items]);

	const handleMouseMove: MouseEventHandler<HTMLDivElement> = useCallback((e) => {
		const menuItems = ref?.current?.children;
		for (let i = 0; i < menuItems.length; i++) {
			const item = menuItems[i] as HTMLElement;
			if (item.contains(e.target as Node)) {
				setActiveIdx(i);
				break;
			}
		}
	}, []);

	const itemClickHandler = useCallback(
		({ item, e, idx }) => {
			onItemClick(item, e, idx);
		},
		[onItemClick],
	);

	const keydownHandler = useCallback(
		(e: KeyboardEvent) => {
			setScrollIntoViewBehavior(e.repeat ? "instant" : "smooth");
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
				e.preventDefault();
				action();
			}
		},
		[moveActiveIdx, onItemClick, items, activeIdx, blurInInput],
	);

	useEffect(() => {
		const inputRef = searchRef?.current?.inputRef;
		inputRef?.addEventListener("keydown", keydownHandler);

		return () => inputRef?.removeEventListener("keydown", keydownHandler);
	}, [keydownHandler, searchRef]);

	return (
		<StyleDiv
			maxItems={maxItems}
			ref={ref}
			onMouseMove={handleMouseMove}
			className={classNames("items", {}, [className])}
			{...otherProps}
		>
			{getArray(buttons).map((button, idx) => {
				const isLastButton = !(getArray(buttons).length - 1 - idx);
				return (
					<Item
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
			})}
			{getArray(items).map((item, index) => {
				const idx = index + (getArray(buttons)?.length || 0);
				return (
					<Item
						key={idx}
						content={item}
						onClick={(e) => {
							itemClickHandler({ item, e, idx: index });
							setIsOpen(false);
							blurInInput();
						}}
						ref={idx === activeIdx ? focusRef : null}
						isActive={idx === activeIdx}
						disable={typeof item === "string" ? null : item?.disable}
					/>
				);
			})}
			{!getArray(items).length && (
				<>
					{isLoadingData && <Item content={LoadingListItem} />}
					{value && !isLoadingData && <RequestValueNotFound value={value} />}
				</>
			)}
		</StyleDiv>
	);
};

const RequestValueNotFound = ({ value }: { value: string }) => (
	<Item
		style={{ display: "flex", justifyContent: "left" }}
		content={{
			element: (
				<span style={{ fontSize: "14px", padding: "6px 12px" }}>
					По запросу <strong>&quot;{value}&quot;</strong> совпадений не найдено.
				</span>
			),
			labelField: "",
		}}
	/>
);

export default Items;
