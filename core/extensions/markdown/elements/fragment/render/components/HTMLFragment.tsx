import type React from "react";

const HTMLFragment = (props: { id?: string; children?: React.ReactNode }) => (
	<div data-component="fragment" data-id={props.id}>
		{props.children}
	</div>
);

export default HTMLFragment;
