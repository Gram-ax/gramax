import { ReactElement, ReactNode } from "react";

interface ColorProps {
	color: string;
	children?: ReactNode;
}

const Color = ({ color, children }: ColorProps): ReactElement => {
	return (
		<span data-color={color} style={{ color }}>
			{children}
		</span>
	);
};

export default Color;
