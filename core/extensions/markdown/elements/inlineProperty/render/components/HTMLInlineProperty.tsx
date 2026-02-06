import React from "react";

const HTMLInlineProperty = (props: { children?: React.ReactNode }) => (
	<span data-component="inline-property">{props.children}</span>
);

export default HTMLInlineProperty;
