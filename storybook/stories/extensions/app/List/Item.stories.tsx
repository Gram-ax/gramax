import ItemSrc from "@components/List/Item";
import { ComponentMeta } from "@storybook/react";
import { memo } from "react";

export const Item = memo(({ content }: { content: string }) => {
	return <ItemSrc content={{ element: <span>{content}</span>, labelField: content }} onClick={(_, c) => alert(c)} />;
});

export default {
	component: Item,
	title: "DocReader/extensions/app/List/Item",
	args: {
		content: "master",
	},
} as ComponentMeta<typeof Item>;
