import { ListItem } from "@components/List/Item";
import ItemsSrc from "@components/List/Items";
import { SearchElement } from "@components/List/Search";
import { Meta } from "@storybook/react";
import { memo, useRef, useCallback, useState } from "react";

export const Items = memo(({ maxItems }: { numberOfItems: number; maxItems: number }) => {
	const searchRef = useRef<SearchElement>(null);
	const itemsRef = useRef<HTMLDivElement>(null);
	const [isOpen, setIsOpen] = useState(true);

	const blurInInput = useCallback(() => {
		if (searchRef.current) {
			searchRef.current.inputRef.blur();
		}
	}, [searchRef.current]);

	const items: ListItem[] = [
		{ element: "DRS-263", labelField: "DRS-263" },
		{ element: "commentDemo", labelField: "commentDemo" },
		{ element: "develop", labelField: "develop" },
		{ element: "leftSidebarRefactor", labelField: "leftSidebarRefactor" },
		{ element: "master", labelField: "master" },
		{ element: "wysiwyg/commentGetUser", labelField: "wysiwyg/commentGetUser" },
		{ element: "wysiwyg/storybookComponentsRefactor", labelField: "wysiwyg/storybookComponentsRefactor" },
		{ element: "remotes/origin/DRS-263", labelField: "remotes/origin/DRS-263" },
	];

	return (
		<div style={{ width: 400 }} ref={itemsRef}>
			<ItemsSrc
				setIsOpen={setIsOpen}
				filteredWidth={500}
				isOpen={isOpen}
				value={"value"}
				searchRef={searchRef}
				blurInInput={blurInInput}
				items={items}
				onItemClick={(_, __, content) => alert(content)}
				maxItems={maxItems}
			/>
		</div>
	);
});

export default {
	component: Items,
	title: "gx/extensions/app/List/Items",
	args: {
		maxItems: 6,
	},
} as Meta<typeof Items>;
