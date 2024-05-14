import Icon from "@components/Atoms/Icon";
import React from "react";

export default function Module({ id }: { id: string }) {
	return (
		<span className="module">
			<Icon style={{paddingRight: "4px"}} code="box" strokeWidth="2" />
			{id}
		</span>
	);
}
