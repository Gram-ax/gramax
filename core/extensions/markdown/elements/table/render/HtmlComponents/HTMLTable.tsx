import type React from "react";

const HTMLTable = (props: { children?: React.ReactNode }) => (
	<table data-component="table">
		<tbody>{props.children}</tbody>
	</table>
);

export default HTMLTable;
