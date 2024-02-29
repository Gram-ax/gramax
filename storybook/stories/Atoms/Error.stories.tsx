import { Meta, StoryObj } from "@storybook/react";
import { ComponentProps } from "react";
import InfoModalForm from "../../../core/extensions/errorHandlers/client/components/ErrorForm";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

type Props = ComponentProps<typeof InfoModalForm> & {
	hasActionButton: boolean;
	actionText: string;
	type: "warning" | "error";
};

const meta: Meta<Props> = {
	title: "gx/Atoms/Error",
	decorators: [InlineDecorator],
	argTypes: {
		type: {
			control: "radio",
			options: ["error", "warning"],
		},
	},
	args: {
		type: "error",
		children: "Текст ошибки",
		hasActionButton: false,
		actionText: "Действие",
	},
};

export default meta;

export const Error: StoryObj<Props> = {
	render: ({ children, type }) => {
		return (
			<InfoModalForm
				title={type === "warning" ? "Предупреждение" : "Ошибка"}
				icon={
					type === "warning"
						? { code: "circle-exclamation", color: "var(--color-admonition-note-br-h)" }
						: { code: "circle-xmark", color: "var(--color-danger)" }
				}
				onCancelClick={function (): void {}}
			>
				{children}
			</InfoModalForm>
		);
	},
};
