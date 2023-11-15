import ItemsSrc from "@components/List/Items";
import { ComponentMeta } from "@storybook/react";
import { memo } from "react";

export const Items = memo(({ numberOfItems, maxItems }: { numberOfItems: number; maxItems: number }) => {
	const items: string[] = [];
	for (let i = 0; i < numberOfItems; i++) items.push("Item №" + i);

	return (
		<ItemsSrc
			items={items.map((item) => ({ element: <span>{item}</span>, labelField: item }))}
			onItemClick={(_, content) => alert(content)}
			maxItems={maxItems}
		/>
	);
});

export default {
	component: Items,
	title: "DocReader/extensions/app/List/Items",
	args: {
		numberOfItems: 5,
		maxItems: 6,
	},
} as ComponentMeta<typeof Items>;
