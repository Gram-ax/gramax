import React from "react";
import HTMLComponents from "../../../core/render/components/getComponents/HTMLComponents";

export interface HTMLCmdProps {
	icon?: string;
	text?: string;
	children?: React.ReactNode;
}

const HTMLCmd = (html: HTMLComponents) => {
	return (props: HTMLCmdProps) => (
		<button data-component="cmd">
			{props.icon && html.renderIcon({ code: props.icon })}
			{props.text && <span>{props.text}</span>}
			{props.children}
		</button>
	);
};

export default HTMLCmd;
