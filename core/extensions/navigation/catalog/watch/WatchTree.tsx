import Icon from "@components/Atoms/Icon";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { useEffect, useRef, useState } from "react";
import { ArticleLink, CategoryLink, ItemLink, LinkFilter } from "../../NavigationLinks";
import IconExtension from "../main/render/IconExtension";
import LevNavItem from "../main/render/Item";

const LevNavWatchTree = ({ items, closeNavigation }: { items: ItemLink[]; closeNavigation?: () => void }) => {
	return (
		<div>
			<Tree items={items} level={0} closeNavigation={closeNavigation} />
		</div>
	);
};

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
		<ul>
			{items.map((item, key) => {
				return !isFiltered || isVisible(filter, item as ArticleLink, key, items.length) ? (
					<Item closeNavigation={closeNavigation} item={item} level={level} key={key} />
				) : null;
			})}
			{filter && isFiltered ? (
				<li onClick={() => setFiltered(false)}>
					<LevNavItem
						onClick={closeNavigation}
						level={level}
						leftExtensions={[<Icon key={0} code="ellipsis" svgStyle={{ fill: "currentColor" }} />]}
					/>
				</li>
			) : null}
		</ul>
	);
};

const Item = ({ item, level, closeNavigation }: { item: ItemLink; level: number; closeNavigation: () => void }) => {
	const ref = useRef<HTMLLIElement>(null);
	const [scrollFlag, setScrollFalag] = useState(true);

	const isActive = item.isCurrentLink;

	const isCategory = item.type === ItemType.category && (item as CategoryLink)?.items?.length !== 0;
	const existsContent = item.type === ItemType.category ? (item as CategoryLink).existContent : true;

	const [isOpen, setIsOpen] = useState(level == 0 || (item as CategoryLink).isExpanded);
	const [allwaysIsOpen, setAllwaysIsOpen] = useState(false);

	const onClick = () => {
		if (existsContent || item.type == ItemType.article) closeNavigation?.();
		if (item.type !== ItemType.category) return;
		if (!existsContent || isActive) {
			setIsOpen(!isOpen);
			if (isOpen && allwaysIsOpen) {
				setAllwaysIsOpen(false);
			}
		} else setIsOpen(true);
	};

	useEffect(() => {
		if (ref.current && scrollFlag && isActive)
			ref.current.scrollIntoView({ behavior: "auto", inline: "center", block: "center" });
		setScrollFalag(false);
	});

	useEffect(() => {
		setIsOpen((item as CategoryLink).isExpanded);
	}, [(item as CategoryLink).isExpanded]);

	useEffect(() => {
		if (isCategory && isOpen) setAllwaysIsOpen(true);
	}, [isOpen]);

	return (
		<li ref={ref}>
			<LevNavItem
				item={item}
				level={level}
				isOpen={isOpen || allwaysIsOpen}
				isActive={isActive}
				isCategory={isCategory}
				leftExtensions={[<IconExtension key={0} item={item} />]}
				onClick={onClick}
			/>
			{isCategory && (isOpen || allwaysIsOpen) && (
				<Tree
					items={(item as CategoryLink).items}
					level={level + 1}
					filter={(item as CategoryLink).filter}
					closeNavigation={closeNavigation}
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
