import { classNames } from "@components/libs/classNames";
import Item from "@components/List/Item";
import LoadingListItem from "@components/List/LoadingListItem";
import { TitleItem } from "@core-ui/ContextServices/LinkTitleTooltip";
import eventEmitter from "@core/utils/eventEmmiter";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { HTMLAttributes, MouseEventHandler, useCallback, useEffect, useRef, useState } from "react";

interface ItemsProps extends HTMLAttributes<HTMLDivElement> {
	items: TitleItem[];
	setIsOpen: (v: boolean) => void;
	itemClickHandler: (item: TitleItem) => void;
	isLoadingData?: boolean;
	isOpen: boolean;
}

const TitleItemsShouldRender = (props: ItemsProps) => {
	return props.isOpen && <TitleItems {...props} />;
};

const TitleItems = (props: ItemsProps) => {
	const { items, setIsOpen, itemClickHandler, isLoadingData, isOpen, className, ...otherProps } = props;
	if (!isOpen) return null;
	const ref = useRef<HTMLDivElement>(null);
	const focusRef = useRef<HTMLDivElement>(null);

	const [activeIdx, setActiveIdx] = useState(0);

	const closeTitleItems = () => setIsOpen(false);

	const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
		const menuItems = ref.current?.children;
		for (let i = 0; i < menuItems.length; i++) {
			const item = menuItems[i] as HTMLElement;
			if (item.contains(e.target as Node)) {
				setActiveIdx(i);
				break;
			}
		}
	};

	const handleClickOutside = useCallback(
		({ e, callback }) => {
			const contains = ref.current?.contains(e.target);

			if (!contains) {
				if (ref.current) callback();
				setIsOpen(false);
			}
		},
		[ref.current],
	);

	useEffect(() => {
		eventEmitter.on("ListLayoutOutsideClick", handleClickOutside);

		return () => {
			eventEmitter.off("ListLayoutOutsideClick", handleClickOutside);
		};
	}, [handleClickOutside]);

	return (
		<div
			ref={ref}
			onMouseMove={handleMouseMove}
			onMouseLeave={closeTitleItems}
			className={classNames("items", {}, [className])}
			{...otherProps}
		>
			<Item
				onClick={(e) => e.stopPropagation()}
				className={"headingItem"}
				content={{ element: t("article-titles"), labelField: "" }}
			/>

			{items.map((item, index) => {
				const idx = index + 1;

				return (
					<Item
						content={{
							element: (
								<span style={{ marginLeft: `${item.level * 8}px` }} title={item.title}>
									{item.title}
								</span>
							),
							value: item.url,
						}}
						onClick={(e) => {
							e.stopPropagation();
							setIsOpen(false);
							itemClickHandler(item);
						}}
						ref={idx === activeIdx ? focusRef : null}
						isActive={idx === activeIdx}
						key={idx}
					/>
				);
			})}
			{!items.length && !isLoadingData && (
				<Item
					onClick={(e) => e.stopPropagation()}
					className={"notFoundItem"}
					content={{ element: t("no-headers"), labelField: "" }}
					disable
				/>
			)}
			{!items.length && isLoadingData && <Item onClick={(e) => e.stopPropagation()} content={LoadingListItem} />}
		</div>
	);
};

export default styled(TitleItemsShouldRender)`
	background: var(--color-tooltip-background) !important;
	width: 200px;

	display: flex;
	flex-direction: column;

	&.items {
		z-index: 2;
		padding: 0;
		position: relative;
		max-height: 182px;
		border-radius: var(--radius-normal);
		box-shadow: var(--shadows-deeplight);
		background: var(--color-code-copy-bg);
		overflow-y: auto;
		overflow-x: hidden;
	}

	.item {
		text-overflow: ellipsis;
		color: var(--color-tooltip-text);
		padding: 5px 10px;
		height: 30px;

		span {
			text-wrap: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.item.active {
		background: var(--color-edit-menu-button-active-bg);
	}

	.headingItem {
		font-weight: 500;
		font-size: 12px;
		line-height: 18px;
		height: 32px;
		padding: 6px 10px;
		text-transform: uppercase;
		color: var(--color-primary-general) !important;
	}

	.notFoundItem {
		padding: 6px 10px;
		line-height: 15px;
		height: 32px;
		color: var(--color-input-disabled-text) !important;
	}
`;
