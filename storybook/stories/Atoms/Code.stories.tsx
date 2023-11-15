import { Meta, StoryObj } from "@storybook/react";
import { ComponentProps } from "react";
import InlineDecorator from "../../styles/decorators/InlineDecorator";
import CodeSrc from "../../../core/extensions/markdown/elements/code/render/component/Code";

type Props = ComponentProps<typeof CodeSrc>;

const meta: Meta<Props> = {
	title: "DocReader/Atoms/Code",
	decorators: [InlineDecorator],
	args: {
		children: "code",
	},
};

export default meta;

export const Code: StoryObj<Props> = {
	render: (props) => <CodeSrc {...props} />,
};
