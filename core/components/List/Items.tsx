import styled from "@emotion/styled";
import React from "react";
import Item, { ListItem } from "./Item";

const Items = styled(
	({
		items,
		onItemClick,
		className,
	}: {
		items: (string | ListItem)[];
		isOpen?: boolean;
		onItemClick?: (value: string | ListItem, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
		maxItems?: number;
		isCode?: boolean;
		hideScrollbar?: boolean;
		filteredWidth?: number;
		className?: string;
	}) => {
		return (
			<div className={"items " + className}>
				{items.map((item, key) => (
					<Item
						key={key}
						content={item}
						onClick={onItemClick}
						disable={typeof item === "string" ? null : item.disable}
					/>
				))}
			</div>
		);
	},
)`
	z-index: 1;
	width: 100%;
	border-radius: 4px;
	transition: height 0.2s;
	box-shadow: var(--shadows-deeplight);
	background: var(--color-code-copy-bg);
	${(p) => (p.isCode ? "" : "left: 5.5px;")}
	${(p) => `max-width: ${p.filteredWidth ?? 0}px;`}

	${(p) => {
		if (p.isOpen === false) return "height: 0px;";

		const height = (p.maxItems ?? 6) * 32;
		return `
        max-height: ${height}px;`;
	}}

	overflow: ${(p) => (p.hideScrollbar ? "hidden" : "auto")};
`;

export default Items;
