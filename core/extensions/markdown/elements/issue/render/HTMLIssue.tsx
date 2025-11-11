import React from "react";
import HTMLComponents from "../../../core/render/components/getComponents/HTMLComponents";
import getIssueLink from "@ext/markdown/elements/issue/logic/getIssueLink";

export interface HTMLIssueProps {
	id: string;
}

const HTMLIssue = (html: HTMLComponents) => {
	return (props: HTMLIssueProps) => {
		const href = getIssueLink(props.id);
		const newHref = href.startsWith("http") ? href : html.getApiArticleResource(href);
		return (
			<a data-component="issue" href={newHref}>
				{props.id}
			</a>
		);
	};
};

export default HTMLIssue;
