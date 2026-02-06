import { NoteType, noteIcons } from "@ext/markdown/elements/note/render/component/Note";
import React from "react";
import HTMLComponents from "../../../../core/render/components/getComponents/HTMLComponents";

interface HTMLNoteProps {
	type?: string;
	title?: React.ReactNode;
	children?: React.ReactNode;
}

const HTMLNote = (html: HTMLComponents) => {
	return (props: HTMLNoteProps) => {
		const { type = NoteType.note, title, children } = props;
		return (
			<div data-component="note" data-type={type}>
				<div className="admonition-heading">
					<div className="admonition-icon">{html.renderIcon({ code: noteIcons[type] })}</div>
					<div className="titleWrapper" contentEditable={false} suppressContentEditableWarning={true}>
						{title}
					</div>
				</div>
				<div className="admonition-content">{children}</div>
			</div>
		);
	};
};

export default HTMLNote;
