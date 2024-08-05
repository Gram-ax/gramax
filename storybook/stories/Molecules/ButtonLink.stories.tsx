import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLinkSrc, { ButtonLinkProps } from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
import { Meta, StoryObj } from "@storybook/react";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

type Story = StoryObj<typeof ButtonLinkSrc>;

export const ButtonLink = (args: ButtonLinkProps) => {
	return (
		<div style={{ background: "var(--color-contextmenu-bg)", padding: "15px" }}>
			<div>
				<ButtonLinkSrc {...args} iconCode="plus" text={t("catalog.new")} />
			</div>
			<div style={{ margin: "8px 0" }}>
				<ButtonLinkSrc {...args} iconCode="cloud" text={t("catalog.clone")} />
			</div>
			<div>
				<ButtonLinkSrc {...args} iconCode={"globe"} />
			</div>
		</div>
	);
};

const meta: Meta<typeof ButtonLinkSrc> = {
	title: "gx/Molecules/ButtonLink",
	component: ButtonLink,
	decorators: [InlineDecorator],
	args: {
		iconCode: "globe",
		textSize: TextSize.S,
	},
};

export const Text_x_small: Story = {
	args: {
		textSize: TextSize.XS,
	},
};

export const Text_small: Story = {
	args: {
		textSize: TextSize.S,
	},
};

export const Text_medium: Story = {
	args: {
		textSize: TextSize.M,
	},
};

export const Text_large: Story = {
	args: {
		textSize: TextSize.L,
	},
};

export const Text_x_large: Story = {
	args: {
		textSize: TextSize.XL,
	},
};

export default meta;
