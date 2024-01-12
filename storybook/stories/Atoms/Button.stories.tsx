import ButtonSrc from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import { Meta } from "@storybook/react";
import { ComponentProps } from "react";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

type Props = { buttonStyle: ButtonStyle } & Pick<
	ComponentProps<typeof ButtonSrc>,
	"disabled" | "children" | "fullWidth"
>;

export const Button = (args: Props) => {
	args = { ...args, children: args.children ? args.children : "text" };
	return <ButtonSrc {...args} />;
};

const meta: Meta<Props> = {
	title: "gx/Atoms/Button",
	component: Button,
	decorators: [InlineDecorator],
	args: {
		children: "text",
		buttonStyle: ButtonStyle.default,
		disabled: false,
		fullWidth: false,
	},
};

export default meta;
