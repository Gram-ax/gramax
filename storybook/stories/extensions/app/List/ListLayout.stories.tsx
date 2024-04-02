import { ListItem, ButtonItem } from "@components/List/Item";
import ListLayoutSrc from "@components/List/ListLayout";
import { Meta } from "@storybook/react";
import { useState } from "react";
import BlockDecorator from "../../../../styles/decorators/InlineDecorator";

export default {
	title: "gx/extensions/app/List/ListLayout",
	args: {
		fit: false,
		openByDefault: true,
		lazy: false,
		withButton: true,
		selectAllOnFocus: true,
	},
	decorators: [
		(Story) => (
			<div style={{ width: "500px" }}>
				<Story />
			</div>
		),
		BlockDecorator,
	],
} as Meta<typeof ListLayout>;

const buttons: ButtonItem[] = [
	{
		element: "Добавить аккаунт...",
		icon: "plus",
		labelField: "",
		onClick: () => console.log("Добавлен"),
	},
	{
		element: "кнопка",
		labelField: "",
		onClick: () => console.log("Кнопочка"),
	},
];

const items = [
	{ element: "develop", labelField: "develop" },
	{ element: "leftSidebarRefactor", labelField: "leftSidebarRefactor" },
	{ element: "master", labelField: "master" },
];

const branches = [
	{ element: "DRS-263", labelField: "DRS-263" },
	{ element: "commentDemo", labelField: "commentDemo" },
	{ element: "develop", labelField: "develop" },
	{ element: "leftSidebarRefactor", labelField: "leftSidebarRefactor" },
	{ element: "master", labelField: "master" },
	{ element: "wysiwyg/commentGetUser", labelField: "wysiwyg/commentGetUser" },
	{ element: "wysiwyg/storybookComponentsRefactor", labelField: "wysiwyg/storybookComponentsRefactor" },
	{ element: "remotes/origin/DRS-263", labelField: "remotes/origin/DRS-263" },
	{ element: "feature/loginPage", labelField: "feature/loginPage" },
	{ element: "hotfix/headerFix", labelField: "hotfix/headerFix" },
	{ element: "release/v2.0", labelField: "release/v2.0" },
	{ element: "bugfix/commentLoading", labelField: "bugfix/commentLoading" },
	{ element: "ui/redesignHomepage", labelField: "ui/redesignHomepage" },
	{ element: "api/integrationTests", labelField: "api/integrationTests" },
	{ element: "feature/userProfile", labelField: "feature/userProfile" },
	{ element: "performance/databaseOptimization", labelField: "performance/databaseOptimization" },
	{ element: "feature/emailNotifications", labelField: "feature/emailNotifications" },
	{ element: "security/oauthImplementation", labelField: "security/oauthImplementation" },
	{ element: "feature/chatSystem", labelField: "feature/chatSystem" },
	{ element: "experiment/newUIConcept", labelField: "experiment/newUIConcept" },
];

export const ListLayout = (props) => {
	const { fit, openByDefault, lazy, withButton, selectAllOnFocus } = props;

	const [itemsFit, setItemsFit] = useState<ListItem[]>(items);
	const [itemsNotFit, setItemsNotFit] = useState<ListItem[]>(branches);
	const [isLoadingData, setIsLoadingData] = useState(false);

	const refresh = () => {
		setItemsNotFit([]);
		setItemsFit([]);
		setIsLoadingData(true);
		setTimeout(() => {
			setItemsNotFit(branches);
			setItemsFit(items);
			setIsLoadingData(false);
		}, 2500);
	};

	return (
		<>
			{lazy && <button onClick={refresh}>Обновить</button>}
			<ListLayoutSrc
				isLoadingData={isLoadingData}
				selectAllOnFocus={selectAllOnFocus}
				buttons={withButton ? buttons : undefined}
				items={fit ? itemsFit : itemsNotFit}
				onItemClick={(content) => console.log(content)}
				placeholder={"placeholder"}
				openByDefault={openByDefault}
			/>
		</>
	);
};
