import { ComponentMeta } from "@storybook/react";
import SideBarResourceSrc from "../../../../core/extensions/git/actions/Publish/components/SideBarResource";
import InlineDecorator from "../../../styles/decorators/InlineDecorator";

export default {
	title: "DocReader/VersionControl/SideBar/Elements/Resources",
	decorators: [InlineDecorator],
	args: {
		title: "resource",
	},
} as ComponentMeta<typeof Resources>;

export const Resources = ({ title }: { title: string }) => {
	return <SideBarResourceSrc title={title} />;
};
