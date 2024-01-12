import { Meta } from "@storybook/react";
// import SideBarResourceSrc from "../../../../core/extensions/git/actions/Publish/components/SideBarResource";
import InlineDecorator from "../../../styles/decorators/InlineDecorator";

export default {
	title: "gx/VersionControl/SideBar/Elements/Resources",
	decorators: [InlineDecorator],
	args: {
		title: "resource",
	},
} as Meta<typeof Resources>;

export const Resources = ({ title }: { title: string }) => {
	return <div>{/*<SideBarResourceSrc title={title} />;*/ title}</div>;
};
