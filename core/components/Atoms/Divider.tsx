import { CSSProperties } from "react";

const Divider = ({ style, className }: { style?: CSSProperties; className?: string }) => {
	return (
		<div
			className={className}
			style={{ width: "100%", height: "0.5px", background: "var(--color-line)", ...style }}
		/>
	);
};

export default Divider;
