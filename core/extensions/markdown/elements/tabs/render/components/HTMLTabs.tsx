import React from "react";

export interface HTMLTabsProps {
	children: React.ReactNode;
}

const HTMLTabs = (props: HTMLTabsProps) => {
	const { children } = props;
	return React.createElement("tabs", null, children);
};

export default HTMLTabs;
