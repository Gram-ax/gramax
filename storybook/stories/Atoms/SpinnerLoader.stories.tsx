import SpinnerLoaderSource from "@components/Atoms/SpinnerLoader";
import { Meta, StoryObj } from "@storybook/react";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

type Props = { size: number };

const meta: Meta<Props> = {
	title: "gx/Atoms/SpinnerLoader",
	decorators: [InlineDecorator],
	args: {
		size: 75,
	},
};

export default meta;

export const SpinnerLoader: StoryObj<Props> = {
	render: ({ size }) => <SpinnerLoaderSource width={size} height={size} />,
};
