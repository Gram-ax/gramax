import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { FocusEvent, forwardRef, KeyboardEvent, RefObject } from "react";

interface CaptionProps {
	text: string;
	autoFocus?: boolean;
	editor: Editor;
	getPos: () => number;
	onUpdate: (text: string) => void;
	onLoseFocus: (e: FocusEvent) => void;
	className?: string;
	visible?: boolean;
}

const Caption = forwardRef<HTMLInputElement, CaptionProps>((props, ref: RefObject<HTMLInputElement>) => {
	const { text, autoFocus = false, editor, getPos, onUpdate, onLoseFocus, className, visible = false } = props;

	const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") return editor.commands.focus(getPos(), { scrollIntoView: false });
		if (e.key === "ArrowDown") return editor.commands.focus(getPos(), { scrollIntoView: false });
	};

	const preventSelect = (e: FocusEvent<HTMLInputElement>) => {
		const target = e.target as HTMLInputElement;
		target.classList.remove("no-selection");
	};

	const preOnBlur = (e: FocusEvent<HTMLInputElement>) => {
		e.target.classList.add("no-selection");
		if (visible) onLoseFocus(e);
	};

	useWatch(() => {
		const input = ref.current;
		if (!input) return;

		input.value = text;
	}, [text]);

	return (
		<input
			ref={ref}
			onFocus={preventSelect}
			type="text"
			defaultValue={text}
			placeholder={t("signature")}
			className={classNames(className, { visible }, ["no-selection", "resource-caption"])}
			onBlur={preOnBlur}
			onChange={(e) => onUpdate(e.target.value)}
			onKeyUp={onKeyUp}
		/>
	);
});

export default styled(Caption)`
	display: flex;
	width: 100%;
	font-size: 13px;
	margin-top: -4px;
	font-weight: 300;
	line-height: 1.4em;
	text-align: center;
	max-height: 0;
	outline: none;
	border: none;
	color: var(--color-image-title);
	font-style: italic;
	background-color: transparent;
	transition: max-height var(--transition-time-fast) ease-in-out;

	&:focus {
		outline: none;
		border: none;
		user-select: none;
	}

	&.no-selection::selection {
		background-color: transparent !important;
	}

	&.visible {
		max-height: 2em;
		margin-bottom: 16px;
	}
`;
