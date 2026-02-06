import React from "react";

const HTMLKbd = (props: { children?: React.ReactNode; text?: string }) => (
	<kbd data-component="kbd">{props.text || props.children}</kbd>
);

export default HTMLKbd;
