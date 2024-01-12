import StatusBarSrc from "@components/Layouts/StatusBar/StatusBar";
import { Meta } from "@storybook/react";
import { Icon } from "../../../../Atoms/Icon.stories";

export default {
	title: "gx/extensions/Catalog/Git/StatusBar",
} as Meta<typeof StatusBar>;

export const StatusBar = () => {
	return (
		<StatusBarSrc
			leftElements={[<div key={1}>left</div>, <div key={2}>more left</div>]}
			rightElements={[<div key={1}>123</div>, <span key={2}>awjdiwajd</span>, <Icon key={3} code="git" />]}
		/>
	);
};
