import React from "react";

const HTMLHighlight = (props: { color?: string; children?: React.ReactNode }) => (
	<mark data-color={props.color} data-component="highlight">
		{props.children}
	</mark>
);

export default HTMLHighlight;
