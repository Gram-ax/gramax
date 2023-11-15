/* eslint-disable react-hooks/rules-of-hooks */
import CheckboxSrc from "@components/Atoms/Checkbox";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

const meta: Meta = {
	title: "DocReader/Atoms/Checkbox",
	decorators: [InlineDecorator],
};
export default meta;
export const Base: StoryObj = {
	render: () => {
		const [checked, setChecked] = useState(false);
		return <CheckboxSrc checked={checked} onClick={() => setChecked(!checked)} />;
	},
};

export const InlineContent: StoryObj<{ interactive: boolean }> = {
	args: { interactive: false },
	render: (props) => {
		const [checked, setChecked] = useState(false);
		return (
			<CheckboxSrc checked={checked} onClick={() => setChecked(!checked)} {...props}>
				<span>some inline content</span>
			</CheckboxSrc>
		);
	},
};

export const BlockContent: StoryObj<{ interactive: boolean }> = {
	args: { interactive: false },
	render: (props) => {
		const [checked, setChecked] = useState(false);
		return (
			<CheckboxSrc checked={checked} onClick={() => setChecked(!checked)} {...props}>
				<div>
					<div>some block content</div>
					<div>some block content</div>
					<div>some block content</div>
					<div>some block content</div>
					<div>some block content</div>
					<div>some block content</div>
					<div>some block content</div>
					<div>some block content</div>
					<div>some block content</div>
					<div>some block content</div>
				</div>
			</CheckboxSrc>
		);
	},
};
