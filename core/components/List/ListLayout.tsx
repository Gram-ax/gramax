import styled from "@emotion/styled";
import { MutableRefObject, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Tooltip from "../Atoms/Tooltip";
import { ListItem } from "./Item";
import Items from "./Items";
import Search, { SearchElement } from "./Search";

export type ListLayoutElement = HTMLDivElement & { searchRef: SearchElement };

const ListLayout = styled(
	forwardRef(
		(
			{
				items,
				icon,
				tabIndex,
				maxItems,
				placeholder,
				isErrorValue,
				hideScrollbar,
				disableSearch,
				item = "",
				isCode = true,
				openByDefault = false,
				selectOnSearchClick = false,
				focusOnMount = true,
				onSearchClick,
				onSearchChange,
				onItemClick,
				onFocus,
				className,
				itemsClassName,
			}: {
				items: (string | ListItem)[];
				item?: string | ListItem;
				icon?: string;
				openByDefault?: boolean;
				placeholder?: string;
				disable?: boolean;
				maxItems?: number;
				tabIndex?: number;
				isCode?: boolean;
				isErrorValue?: boolean;
				hideScrollbar?: boolean;
				selectOnSearchClick?: boolean;
				focusOnMount?: boolean;
				disableSearch?: boolean;
				onSearchClick?: () => void;
				onSearchChange?: (value: string) => void;
				onItemClick?: (
					labelField: string,
					e: React.MouseEvent<HTMLDivElement, MouseEvent>,
					idx: number,
				) => void;
				onFocus?: () => void;
				className?: string;
				itemsClassName?: string;
			},
			ref: MutableRefObject<ListLayoutElement>,
		) => {
			const [filteredWidth, setFilteredWidth] = useState<number>();
			const [filteredItems, setFilteredItems] = useState(items);
			const [isOpen, setIsOpen] = useState(openByDefault);
			const [value, setValue] = useState(item);
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

			const setItem = (v: string) => {
				if (typeof value == "string") return setValue(v);
				if (typeof value.element == "string") return setValue({ ...value, element: v });
				return setValue({ ...value, labelField: v });
			};

			const getStrValue = (value: string | ListItem) =>
				typeof value == "string" ? value : typeof value.element == "string" ? value.element : value.labelField;

			const filterItems = (items: (ListItem | string)[], input: string) => {
				const filter = (item: string): boolean => {
					if (input.endsWith(" ")) return item.endsWith(input.trim());
					return item.toLowerCase().includes(input.toLowerCase());
				};
				return items.filter((item) => {
					if (typeof item === "string") return filter(item);
					if (typeof item.element === "string") return filter(item.element);
					else return item.labelField ? filter(item.labelField) : null;
				});
			};

			const clickHandler = (e: any) => {
				if (itemsRef.current.contains(e.target) || searchRef.current.chevronRef.contains(e.target)) return;
				setIsOpen(false);
			};

			useEffect(() => {
				setValue(item);
			}, [item]);

			useEffect(() => {
				setFilteredItems(items);
			}, [items]);

			useEffect(() => {
				if (value === "") {
					setFilteredItems(items);
					return;
				}
				setFilteredItems(
					filterItems(
						items,
						typeof value == "string"
							? value
							: typeof value.element == "string"
							? value.element
							: value.labelField,
					),
				);
			}, [value]);

			useEffect(() => {
				if (!listRef?.current) return;
				setFilteredWidth(listRef.current.clientWidth);
			});

			useEffect(() => {
				document.addEventListener("mouseup", clickHandler);
				return () => {
					document.removeEventListener("mouseup", clickHandler);
				};
			});

			useEffect(() => {
				if (!focusOnMount) searchRef.current.inputRef.blur();
			}, []);

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
					content={
						<div style={{ width: filteredWidth }} ref={itemsRef}>
							<Items
								className={itemsClassName}
								isCode={isCode}
								filteredWidth={filteredWidth}
								maxItems={maxItems}
								hideScrollbar={hideScrollbar}
								items={filteredItems}
								onItemClick={(value, e) => {
									if (onItemClick)
										onItemClick(
											typeof value === "string" ? value : value.labelField,
											e,
											items.findIndex((item) => item == value),
										);
									setIsOpen(false);
									setValue(value);
								}}
								isOpen={isOpen}
							/>
						</div>
					}
				>
					<div data-qa="list" ref={listRef} className={"list-layout " + className}>
						<Search
							ref={searchRef}
							icon={icon}
							isCode={isCode}
							isOpen={isOpen}
							tabIndex={tabIndex}
							disable={disableSearch}
							placeholder={placeholder}
							isErrorValue={isErrorValue}
							onFocus={onFocus}
							setValue={setItem}
							value={getStrValue(value)}
							onSearchChange={onSearchChange}
							onClick={() => {
								if (onSearchClick) onSearchClick();
								setIsOpen(true);
								if (selectOnSearchClick) searchRef.current.inputRef.select();
								else setItem("");
							}}
							onChevronClick={() => {
								setIsOpen(!isOpen);
								setItem("");
							}}
						/>
					</div>
				</Tooltip>
			);
		},
	),
)`
	width: 100%;
	border-radius: 4px 4px 0px 0px;
	${(p) => (p.disable ? "pointer-events: none;" : "")}
	${(p) => (p.isCode ? "color: var(--color-prism-text);" : "")}
`;

export default ListLayout;
