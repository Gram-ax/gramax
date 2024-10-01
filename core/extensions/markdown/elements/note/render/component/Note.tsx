import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import { ReactElement, useState, MouseEvent } from "react";

export enum NoteType {
	quote = "quote",
	lab = "lab",
	tip = "tip",
	note = "note",
	info = "info",
	danger = "danger",
	hotfixes = "hotfixes",
}

export const noteIcons: { [note in NoteType]: string } = {
	quote: "quote",
	lab: "test-tube-diagonal",
	tip: "lightbulb",
	hotfixes: "wrench",
	info: "info",
	note: "circle-alert",
	danger: "triangle-alert",
};

interface NoteProps {
	type?: NoteType;
	title?: string;
	collapsed?: string | boolean;
	children?: ReactElement;
	className?: string;
	collapseCallback?: (collapse: boolean) => void;
}

const Note = (props: NoteProps): ReactElement => {
	const { type = NoteType.note, title, className, children, collapseCallback, collapsed } = props;
	const [expanded, dispatchExpanded] = useState(!collapsed);

	const toggleExpanded = (e: MouseEvent<HTMLElement>) => {
		e.preventDefault();
		collapseCallback?.(!expanded);
		dispatchExpanded((p) => !p);
	};

	const clickable = !expanded || collapsed;

	return (
		<div
			className={classNames("admonition", {}, [
				`admonition-${type}`,
				`admonition-${title ? "column" : "row"}`,
				className,
			])}
		>
			<div
				className={classNames("admonition-heading", { expanded: !expanded })}
				onClick={clickable ? toggleExpanded : null}
			>
				<div className="admonition-icon">
					{clickable ? (
						<Icon
							style={{ cursor: "pointer", userSelect: "none" }}
							code={expanded ? "chevron-down" : "chevron-right"}
						/>
					) : (
						<Icon code={noteIcons[type]} strokeWidth="2" />
					)}
				</div>
				<div contentEditable={"false"} suppressContentEditableWarning={true} className={"titleWrapper"}>
					<div className={classNames("title", { clickable })}>{title}</div>
				</div>
			</div>
			<div className="admonition-content">{expanded && <div className="paragraph">{children}</div>}</div>
		</div>
	);
};

export default Note;
