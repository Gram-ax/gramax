import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { ComponentMeta } from "@storybook/react";

export default {
	title: "DocReader/Layouts/PopupMenuLayout",
	component: PopupMenuLayout,
} as ComponentMeta<typeof PopupMenuLayout>;

export const Basic = () => (
	<PopupMenuLayout>
		<>
			<div>text text text text text text text text</div>
			<div>text text text text text text text text</div>
			<div>129i21i9e9i1d9iwq9idawd</div>
		</>
	</PopupMenuLayout>
);
