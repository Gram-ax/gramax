import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayout from "@components/Layouts/Modal";
import { ComponentMeta } from "@storybook/react";

export default {
	title: "DocReader/Layouts/ModalLayout",
	component: ModalLayout,
} as ComponentMeta<typeof ModalLayout>;

export const Basic = () => (
	<ModalLayout>
		<div>text</div>
	</ModalLayout>
);

export const ButtonLayout = () => (
	<ModalLayout>
		<ButtonsLayout>
			<div>text2</div>
			<div className="divider" />
			<div>text2</div>
			<div>text2</div>
		</ButtonsLayout>
	</ModalLayout>
);
