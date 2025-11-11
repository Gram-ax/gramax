import React from "react";
import HTMLComponents from "../../../../core/render/components/getComponents/HTMLComponents";

export interface HTMLIconProps {
	svg?: string;
	color?: string;
	code?: string;
}

export function HTMLIcon(html: HTMLComponents) {
	return (props: HTMLIconProps) => {
		if (props.svg) {
			return (
				<i
					data-component="icon"
					style={{ color: props.color }}
					dangerouslySetInnerHTML={{ __html: props.svg }}
				/>
			);
		}
		return html.renderIcon({
			code: props.code,
			"data-component": "icon",
			style: { color: props.color },
		});
	};
}
