import React from "react";

const HTMLColor = (props: { color: string; children?: React.ReactNode }) => (
	<span data-color={props.color} data-component="color" style={{ color: props.color }}>
		{props.children}
	</span>
);

export default HTMLColor;
