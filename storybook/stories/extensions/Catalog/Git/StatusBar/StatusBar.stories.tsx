import StatusBarSrc from "@components/Layouts/StatusBar/StatusBar";
import { ComponentMeta } from "@storybook/react";
import { Icon } from "../../../../Atoms/Icon.stories";

export default {
	title: "DocReader/extensions/Catalog/Git/StatusBar",
} as ComponentMeta<typeof StatusBar>;

export const StatusBar = () => {
	return (
		<StatusBarSrc
			leftElements={[<div key={1}>left</div>, <div key={2}>more left</div>]}
			rightElements={[<div key={1}>123</div>, <span key={2}>awjdiwajd</span>, <Icon key={3} code="git" />]}
		/>
	);
};
