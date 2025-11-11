import React from "react";

const HTMLHighlight = (props: { color?: string; children?: React.ReactNode }) => (
	<mark data-component="highlight" data-color={props.color}>
		{props.children}
	</mark>
);

export default HTMLHighlight;
