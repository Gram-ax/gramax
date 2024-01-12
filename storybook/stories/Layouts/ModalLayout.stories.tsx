import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayout from "@components/Layouts/Modal";
import { Meta } from "@storybook/react";

export default {
	title: "gx/Layouts/ModalLayout",
	component: ModalLayout,
} as Meta<typeof ModalLayout>;

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
