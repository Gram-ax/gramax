import Icon from "@components/Atoms/Icon";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import EditMenu from "@ext/item/EditMenu";
import t from "@ext/localization/locale/translate";
import useHandleItemClick from "@ext/navigation/catalog/main/logic/handleClick";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";
import { Button } from "@ui-kit/Button";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArticleLink, CategoryLink, ItemLink, LinkFilter } from "../../NavigationLinks";
import IconExtension from "../main/render/IconExtension";
import LevNavItem from "../main/render/Item";

const LevNavWatchTree = React.memo(
	({ items, closeNavigation }: { items: ItemLink[]; closeNavigation?: () => void }) => {
		return (
			<div>
				<Tree closeNavigation={closeNavigation} items={items} level={0} />
			</div>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.items === nextProps.items;
	},
);

const Tree = ({
	items,
	level,
	filter,
	closeNavigation,
}: {
	items: ItemLink[];
	level: number;
	filter?: LinkFilter;
	closeNavigation?: () => void;
}) => {
	const [isFiltered, setFiltered] = useState(true);
	return (
		<ul className={level === 0 ? "tree-root" : ""}>
			{items.map((item, key) => {
				return !isFiltered || isVisible(filter, item as ArticleLink, key, items.length) ? (
					<Item closeNavigation={closeNavigation} item={item} key={key} level={level} />
				) : null;
			})}
			{filter && isFiltered ? (
				<li onClick={() => setFiltered(false)}>
					<LevNavItem
						leftExtensions={<Icon code="ellipsis" svgStyle={{ fill: "currentColor" }} />}
						level={level}
						onClick={closeNavigation}
					/>
				</li>
			) : null}
		</ul>
	);
};

const Item = ({ item, level, closeNavigation }: { item: ItemLink; level: number; closeNavigation: () => void }) => {
	const ref = useRef<HTMLLIElement>(null);
	const [scrollFlag, setScrollFalag] = useState(true);
	const [isHover, setIsHover] = useState(false);

	const isActive = item.isCurrentLink;

	const isCategory = item.type === ItemType.category && (item as CategoryLink)?.items?.length !== 0;
	const existsContent = item.type === ItemType.category ? (item as CategoryLink).existContent : true;

	const [isOpen, setIsOpen] = useState(level == 0 || (item as CategoryLink).isExpanded);

	const onToggle = () => {
		setIsOpen(!isOpen);
	};

	const toggleFunction = useCallback(() => {
		if (isActive || !isOpen) onToggle();
	}, [onToggle]);

	const handleCloseNavigation = useCallback(() => {
		if (existsContent || item.type == ItemType.article) closeNavigation?.();
	}, [closeNavigation]);

	const handleClick = useHandleItemClick({
		isCurrentLink: isActive,
		itemPath: item.pathname,
		closeNavigation: handleCloseNavigation,
		toggleFunction,
	});

	useEffect(() => {
		if (ref.current && scrollFlag && isActive)
			ref.current.scrollIntoView({ behavior: "auto", inline: "center", block: "center" });
		setScrollFalag(false);
	});

	useEffect(() => {
		if ((item as CategoryLink).isExpanded) setIsOpen((item as CategoryLink).isExpanded);
	}, [(item as CategoryLink).isExpanded]);

	return (
		<li ref={ref}>
			<LevNavItem
				isCategory={isCategory}
				isHover={isHover}
				isOpen={isOpen}
				item={item}
				leftExtensions={<IconExtension item={item} />}
				level={level}
				onClick={handleClick}
				onToggle={onToggle}
				rightExtensions={
					<NavigationDropdown
						style={{ marginRight: "-3px" }}
						tooltipText={t("article.actions.title")}
						trigger={
							<Button className="p-0 h-full" size="xs" variant="text">
								<Icon code="ellipsis-vertical" />
							</Button>
						}
					>
						<EditMenu
							isCategory={isCategory}
							itemLink={item}
							onClose={() => setIsHover(false)}
							onOpen={() => setIsHover(true)}
							setItemLink={() => {}}
						/>
					</NavigationDropdown>
				}
			/>
			{isCategory && isOpen && (
				<Tree
					closeNavigation={closeNavigation}
					filter={(item as CategoryLink).filter}
					items={(item as CategoryLink).items}
					level={level + 1}
				/>
			)}
		</li>
	);
};

function isVisible(filter: LinkFilter, articleLink: ArticleLink, idx: number, count: number): boolean {
	if (!filter) return true;
	if (articleLink.alwaysShow) return true;
	if (filter.top && filter.top > idx) return true;
	if (filter.last && filter.last >= count - idx) return true;
	return false;
}

export default LevNavWatchTree;
