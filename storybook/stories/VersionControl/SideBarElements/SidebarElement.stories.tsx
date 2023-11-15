/* eslint-disable react-hooks/rules-of-hooks */
import Sidebar from "@components/Layouts/Sidebar";
import { StoryObj } from "@storybook/react";
import { ComponentProps, useState } from "react";
import SideBarArticleActions from "../../../../core/extensions/git/actions/Publish/components/SideBarArticleActions";
import InlineDecorator from "../../../styles/decorators/InlineDecorator";
import { Branch } from "../../extensions/Catalog/Git/Atoms/Branch.stories";

const SidebarElementData = {
	title: "DocReader/VersionControl/SideBar/Elements/SideBarElement",
	decorators: [
		(Story) => (
			<div style={{ background: "lightblue", width: "200px" }}>
				<Story />
			</div>
		),
		InlineDecorator,
	],
	args: {
		title: "title",
	},
};

export const Base: StoryObj<ComponentProps<typeof Sidebar>> = {
	render: (args) => {
		return <Sidebar {...args} />;
	},
};

export const Publish: StoryObj<ComponentProps<typeof SideBarArticleActions> & { hasLogicPath: boolean }> = {
	args: {
		hasLogicPath: true,
	},
	render: (args) => {
		const [checked, setChecked] = useState(false);
		return (
			<SideBarArticleActions
				{...args}
				onChangeCheckbox={(isChecked) => setChecked(isChecked)}
				checked={checked}
				resources={[]}
				filePath={{ path: "path/to/file" }}
				logicPath={args.hasLogicPath ? "path/to/file" : null}
				goToActicleOnClick={() => {}}
			/>
		);
	},
};

export const GitBranch = Branch;

export default SidebarElementData;
