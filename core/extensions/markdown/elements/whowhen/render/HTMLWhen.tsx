import React from "react";
import HTMLComponents from "../../../core/render/components/getComponents/HTMLComponents";

export interface HTMLWhenProps {
	text?: string;
	children?: React.ReactNode;
}

const HTMLWhen = (html: HTMLComponents) => {
	return (props: HTMLWhenProps) => (
		<span data-component="when">
			<span className="delimiter">/</span>x{html.renderIcon({ code: "clock" })}
			<span>{props.text || props.children}</span>
		</span>
	);
};

export default HTMLWhen;
