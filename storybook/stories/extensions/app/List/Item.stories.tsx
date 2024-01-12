import ItemSrc from "@components/List/Item";
import { Meta } from "@storybook/react";
import { memo } from "react";

export const Item = memo(({ content }: { content: string }) => {
	return <ItemSrc content={{ element: <span>{content}</span>, labelField: content }} onClick={(e) => alert(e)} />;
});

export default {
	component: Item,
	title: "gx/extensions/app/List/Item",
	args: {
		content: "master",
	},
} as Meta<typeof Item>;
