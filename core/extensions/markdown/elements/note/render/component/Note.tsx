import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
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
	titleEditor?: ReactElement;
	children?: ReactElement;
	collapsed?: string | boolean;
	className?: string;
	collapseCallback?: (collapse: boolean) => void;
}

const Note = (props: NoteProps): ReactElement => {
	const { type = NoteType.note, title, className, children, collapseCallback, collapsed, titleEditor } = props;
	const [expanded, dispatchExpanded] = useState(!collapsed);

	const toggleExpanded = (e: MouseEvent<HTMLElement>) => {
		e.preventDefault();
		const target = e.target as HTMLElement;
		if (target.tagName === "INPUT") return;
		collapseCallback?.(!expanded);
		dispatchExpanded((p) => !p);
	};

	useWatch(() => {
		dispatchExpanded(!collapsed);
		collapseCallback?.(!collapsed);
	}, [collapsed]);

	const clickable = !expanded || collapsed;
	const hasTitle = title || titleEditor;

	return (
		<div
			className={classNames("admonition", {}, [
				`admonition-${type}`,
				`admonition-${hasTitle ? "column" : "row"}`,
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
				<div contentEditable={false} suppressContentEditableWarning={true} className="titleWrapper">
					<div className={classNames("title", { clickable: clickable && !titleEditor })}>
						{titleEditor || title}
					</div>
				</div>
			</div>
			<div className="admonition-content">
				<div className={classNames("paragraph", { "content-hide": !expanded })}>{children}</div>
			</div>
		</div>
	);
};

export default Note;
