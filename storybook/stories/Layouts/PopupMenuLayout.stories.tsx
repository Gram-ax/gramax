import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { Meta } from "@storybook/react";

export default {
	title: "gx/Layouts/PopupMenuLayout",
	component: PopupMenuLayout,
} as Meta<typeof PopupMenuLayout>;

export const Basic = () => (
	<PopupMenuLayout>
		<>
			<div>text text text text text text text text</div>
			<div>text text text text text text text text</div>
			<div>129i21i9e9i1d9iwq9idawd</div>
		</>
	</PopupMenuLayout>
);
