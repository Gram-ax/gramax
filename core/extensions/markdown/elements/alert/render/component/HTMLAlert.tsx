import { AlertType } from "@ext/markdown/elements/alert/render/component/Alert";
import React from "react";
import HTMLComponents from "../../../../core/render/components/getComponents/HTMLComponents";

export interface HTMLAlertProps {
	type?: string;
	title?: React.ReactNode;
	children?: React.ReactNode;
}

const HTMLAlert = (html: HTMLComponents) => {
	return (props: HTMLAlertProps) => {
		const { type = AlertType.warning, title, children } = props;
		return (
			<div data-component="alert" data-type={type}>
				<div className="admonition-heading">
					<div className="admonition-icon">{html.renderIcon({ code: "circle-alert" })}</div>
					<div className="titleWrapper">{title}</div>
				</div>
				<div className="admonition-content">{children}</div>
			</div>
		);
	};
};

export default HTMLAlert;
