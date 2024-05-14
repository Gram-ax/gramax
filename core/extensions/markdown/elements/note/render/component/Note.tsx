import Icon from "@components/Atoms/Icon";
import { ReactElement } from "react";

export enum NoteType {
	none = "none",
	lab = "lab",
	tip = "tip",
	note = "note",
	info = "info",
	danger = "danger",
	hotfixes = "hotfixes",
}

export const noteIcons: { [note in NoteType]: string } = {
	none: "alert-circle",
	lab: "test-tube-diagonal",
	tip: "lightbulb",
	hotfixes: "wrench",
	info: "info",
	note: "circle-alert",
	danger: "triangle-alert",
};

const Note = ({
	type,
	title,
	children,
}: {
	type?: NoteType;
	title?: string;
	children?: ReactElement;
}): ReactElement => {
	type = type ? type : NoteType.note;
	return (
		<div className={`admonition admonition-${type} admonition-${title ? "column" : "row"}`}>
			<div className="admonition-heading">
				<div className="admonition-icon">
					<Icon code={noteIcons[type]} strokeWidth="2"/>
				</div>
				<h5>{title}</h5>
			</div>
			<div className="admonition-content">
				<div className="paragraph">{children}</div>
			</div>
		</div>
	);
};

export default Note;
