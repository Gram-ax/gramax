import React, { ReactElement, ReactNode } from "react";

const Color = ({
	color,
	children,
	isInline,
}: {
	color: string;
	children?: ReactNode;
	isInline?: boolean;
}): ReactElement => {
	return React.createElement(`${isInline ? "span" : "div"}`, { style: { color } }, children);
};
export default Color;
