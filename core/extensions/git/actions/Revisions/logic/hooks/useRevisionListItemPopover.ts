import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { useRevisionCatalogStore } from "@ext/git/actions/Revisions/logic/store/RevisionCatalogStore";
import type React from "react";
import { useCallback, useRef, useState } from "react";

const HOVER_OPEN_DELAY = 400;
const HOVER_CLOSE_DELAY = 150;

interface UseRevisionListItemPopoverProps {
	onOpen?: () => void;
	onOpenChange?: (open: boolean) => void;
}

export const useRevisionListItemPopover = ({ onOpen, onOpenChange }: UseRevisionListItemPopoverProps) => {
	const articleRef = ArticleRefService.value;
	const triggerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const openTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

	const [open, setOpen] = useState(false);
	const [frozenRect, setFrozenRect] = useState<DOMRect>(null);

	const { status } = useRevisionCatalogStore((state) => ({ status: state.status }));

	const cancelTimers = useCallback(() => {
		if (openTimerRef.current) clearTimeout(openTimerRef.current);
		if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
	}, []);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (status === "comparing") return;
			setOpen(open);
			onOpenChange?.(open);
			setFrozenRect(open ? triggerRef.current?.getBoundingClientRect() : null);
		},
		[onOpenChange, status],
	);

	const handleTriggerMouseEnter = useCallback(() => {
		cancelTimers();
		if (status === "comparing") return;
		openTimerRef.current = setTimeout(() => {
			onOpen?.();
			handleOpenChange(true);
		}, HOVER_OPEN_DELAY);
	}, [cancelTimers, handleOpenChange, onOpen, status]);

	const handleTriggerMouseLeave = useCallback(
		(e: React.MouseEvent) => {
			cancelTimers();
			if (contentRef.current?.contains(e.relatedTarget as Node)) return;
			closeTimerRef.current = setTimeout(() => handleOpenChange(false), HOVER_CLOSE_DELAY);
		},
		[cancelTimers, handleOpenChange],
	);

	const handleContentMouseEnter = useCallback(() => {
		cancelTimers();
	}, [cancelTimers]);

	const handleContentMouseLeave = useCallback(
		(e: React.MouseEvent) => {
			cancelTimers();
			if (triggerRef.current?.contains(e.relatedTarget as Node)) return;
			closeTimerRef.current = setTimeout(() => handleOpenChange(false), HOVER_CLOSE_DELAY);
		},
		[cancelTimers, handleOpenChange],
	);

	const onFocusOutside = useCallback(
		(e) => {
			if (articleRef.current?.contains(e.target)) e.preventDefault();
		},
		[articleRef],
	);

	const onInteractOutside = useCallback((event) => {
		if (triggerRef.current?.contains(event.target)) event.preventDefault();
	}, []);

	return {
		open,
		frozenRect,
		triggerRef,
		contentRef,
		handleOpenChange,
		handleTriggerMouseEnter,
		handleTriggerMouseLeave,
		handleContentMouseEnter,
		handleContentMouseLeave,
		onFocusOutside,
		onInteractOutside,
	};
};
