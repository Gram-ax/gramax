import React, { ReactElement, ReactNode } from "react";

interface ColorProps {
	color: string;
	children?: ReactNode;
	isInline?: boolean;
}

const Color = ({ color, children, isInline }: ColorProps): ReactElement => {
	return React.createElement(`${isInline ? "span" : "div"}`, { style: { color } }, children);
};
export default Color;
