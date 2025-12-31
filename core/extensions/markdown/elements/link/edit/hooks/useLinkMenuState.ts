import { Editor } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { useCallback, useRef, useState } from "react";
import { getMarkStartPos } from "@ext/markdown/elementsUtils/getMarkStartPos";
import { getMarkEndPos } from "@ext/markdown/elementsUtils/getMarkEndPos";
import { getLinkToHeading } from "@ext/markdown/elements/link/edit/logic/getLinkToHeading";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import { isExternalLink } from "@core-ui/hooks/useExternalLink";

export const useLinkMenuState = (editor: Editor) => {
	const [mark, setMark] = useState<Mark>(null);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const markRef = useRef<Mark>(null);
	const posRef = useRef<{ from: number; to: number }>(null);

	const getMark = useCallback(
		(pos: number) => {
			const $currentPos = editor.state.doc.resolve(pos);
			const $prevPos = editor.state.doc.resolve(pos - 1);
			const $nextPos = editor.state.doc.resolve(pos + 1);

			const nextMarkIsLink = $nextPos.marks().find((mark) => mark.type.name === "link");
			const beforeMarkIsLink = $prevPos.marks().find((mark) => mark.type.name === "link");
			const currentMarkIsLink = $currentPos.marks().find((mark) => mark.type.name === "link");

			return { after: nextMarkIsLink, before: beforeMarkIsLink, current: currentMarkIsLink };
		},
		[editor],
	);

	const updateMarkState = useCallback(() => {
		const { from, empty } = editor.state.selection;
		if (!empty) {
			return { shouldShow: false, mark: null };
		}

		const docSize = editor.state.doc.content.size;

		if (from + 1 > docSize) {
			return { shouldShow: false, mark: null };
		}

		const { after: nextMarkIsLink, before: beforeMarkIsLink, current: currentMarkIsLink } = getMark(from);

		const isNextMarkIsLink = Boolean(nextMarkIsLink);
		const isBeforeMarkIsLink = Boolean(beforeMarkIsLink);
		const isActive = Boolean(currentMarkIsLink);

		if (isNextMarkIsLink || isBeforeMarkIsLink || isActive) {
			const findStartPos = isActive ? from : isNextMarkIsLink ? from + 1 : from - 1;
			const findEndPos = isActive ? from : isNextMarkIsLink ? from + 1 : from - 1;

			const startPos = getMarkStartPos(editor.state.doc, "link", findStartPos);
			const endPos = getMarkEndPos(editor.state.doc, "link", findEndPos);

			const foundMark = currentMarkIsLink || nextMarkIsLink || beforeMarkIsLink;
			markRef.current = foundMark;
			setMark(foundMark);
			posRef.current = { from: startPos, to: endPos };

			return { shouldShow: true, mark: foundMark };
		}

		return { shouldShow: false, mark: null };
	}, [editor, getMark]);

	const shouldShow = useCallback(() => {
		const result = updateMarkState();
		if (result.shouldShow) {
			setIsOpen(true);
		}
		return result.shouldShow;
	}, [updateMarkState, setIsOpen]);

	const getMarkPos = useCallback(() => {
		const { from, to } = posRef.current || {};
		if (!from || !to) return { from: 0, to: 0 };
		return { from, to };
	}, []);

	const handleDelete = useCallback(
		(pos?: { from: number; to: number }) => {
			const { from, to } = pos || getMarkPos();
			if (!from || !to) return;

			const anchorPos = editor.state.selection.$anchor.pos;

			editor
				.chain()
				.setTextSelection({ from: from - 1, to: to + 1 })
				.unsetMark("link")
				.setTextSelection(anchorPos)
				.focus(anchorPos)
				.run();
		},
		[editor, getMarkPos],
	);

	const onUpdate = useCallback(
		(relativePath: string, newHref: string, mark: any) => {
			const from = posRef.current?.from;
			const to = posRef.current?.to;

			let hash = "";
			let href = mark.attrs.href;

			const transaction = editor.state.tr;
			const text = editor.state.doc.textBetween(from, to, undefined, " ");

			transaction.removeMark(from, to, mark);

			const hashHatch = getLinkToHeading(newHref);
			const parsedUrl = parseStorageUrl(newHref);
			const isArticle = parsedUrl.domain && parsedUrl.domain !== "...";
			const { isExternal } = isExternalLink(newHref);
			const textIsLink = text === mark.attrs.href;

			if (isExternal && textIsLink) transaction.deleteRange(from, to);

			if (hashHatch) {
				href = hashHatch[1];
				hash = hashHatch?.[2] ?? "";
			}

			mark.attrs = {
				...mark.attrs,
				resourcePath: isArticle ? relativePath : isExternal ? newHref : href,
				hash,
				href: newHref.split("#")?.[0],
			};

			if (isExternal && textIsLink) transaction.insertText(href, from);
			transaction.addMark(from, isExternal && textIsLink ? from + href.length : to, mark);
			editor.view.dispatch(transaction);

			setMark(mark);
		},
		[editor],
	);

	const reset = useCallback(() => {
		const pos = posRef.current;
		const currentMark = markRef.current;

		posRef.current = null;
		markRef.current = null;

		if (!currentMark?.attrs?.href && pos) handleDelete(pos);

		setMark(null);
		setIsOpen(false);
	}, [handleDelete]);

	return {
		mark,
		isOpen,
		setIsOpen,
		shouldShow,
		updateMarkState,
		getMarkPos,
		onUpdate,
		handleDelete,
		reset,
		getMark,
	};
};
