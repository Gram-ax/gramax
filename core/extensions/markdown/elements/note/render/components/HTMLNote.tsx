import React from "react";
import HTMLComponents from "../../../../core/render/components/getComponents/HTMLComponents";
import { noteIcons, NoteType } from "@ext/markdown/elements/note/render/component/Note";

interface HTMLNoteProps {
	type?: string;
	title?: React.ReactNode;
	children?: React.ReactNode;
}

const HTMLNote = (html: HTMLComponents) => {
	return (props: HTMLNoteProps) => {
		const { type = NoteType.note, title, children } = props;
		return (
			<div data-component="note">
				<div className="admonition-heading">
					<div className="admonition-icon">{html.renderIcon({ code: noteIcons[type] })}</div>
					<div contentEditable={false} suppressContentEditableWarning={true} className="titleWrapper">
						{title}
					</div>
				</div>
				<div className="admonition-content">{children}</div>
			</div>
		);
	};
};

export default HTMLNote;
