import PopupMenuLayout, { PopupMenuElement } from "@components/Layouts/PopupMenuLayout";
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

export const PopupElement = () => (
	<div style={{ backgroundColor: "white" }}>
		<PopupMenuElement tooltipText="tooltip text" IconElement={<div>Icon element</div>}></PopupMenuElement>
	</div>
);
