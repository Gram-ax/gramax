import { ListItem } from "@components/List/Item";
import ListLayoutSrc from "@components/List/ListLayout";
import { ComponentMeta } from "@storybook/react";
import BlockDecorator from "../../../../styles/decorators/InlineDecorator";

export default {
	title: "DocReader/extensions/app/List/ListLayout",
	args: {
		fit: false,
		openByDefault: true,
		placeholder: "placeholder",
	},
	decorators: [
		(Story) => (
			<div style={{ width: "500px" }}>
				<Story />
			</div>
		),
		BlockDecorator,
	],
} as ComponentMeta<typeof ListLayout>;

export const ListLayout = ({
	fit,
	placeholder,
	openByDefault,
}: {
	fit: boolean;
	placeholder: string;
	openByDefault: boolean;
}) => {
	const itemsFit: ListItem[] = [
		{ element: <>develop</>, labelField: "develop" },
		{ element: <>leftSidebarRefactor</>, labelField: "leftSidebarRefactor" },
		{ element: <>master</>, labelField: "master" },
	];

	const itemsNotFit: ListItem[] = [
		{ element: <>DRS-263</>, labelField: "DRS-263" },
		{ element: <>commentDemo</>, labelField: "commentDemo" },
		{ element: <>develop</>, labelField: "develop" },
		{ element: <>leftSidebarRefactor</>, labelField: "leftSidebarRefactor" },
		{ element: <>master</>, labelField: "master" },
		{ element: <>wysiwyg/commentGetUser</>, labelField: "wysiwyg/commentGetUser" },
		{ element: <>wysiwyg/storybookComponentsRefactor</>, labelField: "wysiwyg/storybookComponentsRefactor" },
		{ element: <>remotes/origin/DRS-263</>, labelField: "remotes/origin/DRS-263" },
	];

	return (
		<ListLayoutSrc
			items={fit ? itemsFit : itemsNotFit}
			onItemClick={(content) => console.log(content)}
			placeholder={placeholder}
			openByDefault={openByDefault}
		/>
	);
};
