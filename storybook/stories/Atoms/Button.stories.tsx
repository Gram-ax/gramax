import ButtonSrc, { ButtonProps, TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import { Meta, StoryObj } from "@storybook/react";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

type Story = StoryObj<typeof ButtonSrc>;

export const Button = (args: ButtonProps) => {
	args = { ...args, children: args.children ? args.children : "text" };
	return <ButtonSrc {...args} />;
};

const meta: Meta<typeof ButtonSrc> = {
	title: "gx/Atoms/Button",
	component: Button,
	decorators: [InlineDecorator],
	args: {
		children: "text",
		buttonStyle: ButtonStyle.default,
		disabled: false,
		textSize: TextSize.L,
		fullWidth: false,
	},
};

export const Orange: Story = {
	args: {
		buttonStyle: ButtonStyle.orange,
	},
};

export const TransparentUnderline: Story = {
	args: {
		buttonStyle: ButtonStyle.underline,
	},
};

export const Transparent: Story = {
	args: {
		buttonStyle: ButtonStyle.transparent,
	},
};

export const Git: Story = {
	args: {
		buttonStyle: ButtonStyle.git,
	},
};

export const Purple: Story = {
	args: {
		buttonStyle: ButtonStyle.purple,
	},
};

export default meta;
