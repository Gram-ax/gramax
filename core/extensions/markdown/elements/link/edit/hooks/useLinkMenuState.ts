import parseStorageUrl from "@core/utils/parseStorageUrl";
import { isExternalLink } from "@core-ui/hooks/useExternalLink";
import { getHref } from "@ext/markdown/elements/link/edit/logic/getHref";
import { getLinkMarks } from "@ext/markdown/elements/link/edit/logic/getLinkMarks";
import { getLinkToHeading } from "@ext/markdown/elements/link/edit/logic/getLinkToHeading";
import { getMarkEndPos } from "@ext/markdown/elementsUtils/getMarkEndPos";
import { getMarkStartPos } from "@ext/markdown/elementsUtils/getMarkStartPos";
import type { Editor } from "@tiptap/core";
import type { Mark } from "@tiptap/pm/model";
import { useCallback, useRef, useState } from "react";

const normalizeLinkData = (relativePath: string, newHref: string, isExternal: boolean) => {
	const parsedHref = getLinkToHeading(newHref);
	const parsedRelativePath = getLinkToHeading(relativePath);

	const href = parsedHref?.path ?? newHref;
	const hash = parsedHref?.hash ?? "";
	const resourcePath = parsedRelativePath?.path ?? relativePath;

	return {
		href,
		hash,
		resourcePath: isExternal ? newHref : resourcePath,
	};
};

export const useLinkMenuState = (editor: Editor) => {
	const [mark, setMark] = useState<Mark>(null);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const markRef = useRef<Mark>(null);
	const posRef = useRef<{ from: number; to: number }>(null);

	const getMark = useCallback((pos: number) => getLinkMarks(editor.state.doc, pos), [editor]);

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
	}, [updateMarkState]);

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
		// biome-ignore lint/suspicious/noExplicitAny: access readonly attributes
		(relativePath: string, newHref: string, mark: any) => {
			const innerFrom = posRef.current?.from;
			const innerTo = posRef.current?.to;
			if (innerFrom == null || innerTo == null) return;

			const from = innerFrom - 1;
			const to = innerTo + 1;

			const transaction = editor.state.tr;
			const text = editor.state.doc.textBetween(from, to, undefined, " ");

			transaction.removeMark(from, to, mark.type);

			const parsedUrl = parseStorageUrl(newHref);
			const isArticle = parsedUrl.domain && parsedUrl.domain !== "...";
			const { isExternal } = isExternalLink(newHref);
			const textIsLink = text === getHref(mark);
			const { href, hash, resourcePath } = normalizeLinkData(relativePath, newHref, isExternal);

			if (isExternal && textIsLink) transaction.deleteRange(from, to);

			const updatedMark = mark.type.create({
				...mark.attrs,
				resourcePath: isArticle ? resourcePath : isExternal ? newHref : href,
				hash,
				href,
			});

			if (isExternal && textIsLink) transaction.insertText(newHref, from);
			transaction.addMark(from, isExternal && textIsLink ? from + newHref.length : to, updatedMark);
			editor.view.dispatch(transaction);

			setMark(updatedMark);
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
