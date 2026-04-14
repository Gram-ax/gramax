import type React from "react";
import type HTMLComponents from "../../../core/render/components/getComponents/HTMLComponents";

export interface HTMLWhoProps {
	text?: string;
	children?: React.ReactNode;
}

const HTMLWho = (html: HTMLComponents) => {
	return (props: HTMLWhoProps) => (
		<span data-component="who">
			<span className="delimiter">/</span>
			{html.renderIcon({ code: "circle-user" })}
			<span>{props.text || props.children}</span>
		</span>
	);
};

export default HTMLWho;
