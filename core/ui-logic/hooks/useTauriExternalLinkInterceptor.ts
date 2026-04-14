import resolveModule from "@app/resolveModule/frontend";
import { useEffect } from "react";
import { usePlatform } from "./usePlatform";

const INTERNAL_PROTOCOLS = new Set(["about", "blob", "data", "gramax", "javascript", "tauri"]);

export const isTauriExternalHref = (href?: string | null): boolean => {
	const value = href?.trim();
	if (!value) return false;

	if (
		value.startsWith("#") ||
		value.startsWith("/") ||
		value.startsWith("./") ||
		value.startsWith("../") ||
		value.startsWith("?")
	) {
		return false;
	}

	if (value.startsWith("//")) return true;

	const scheme = value.match(/^([a-zA-Z][a-zA-Z\d+.-]*):/)?.[1]?.toLowerCase();
	if (!scheme) return false;

	return !INTERNAL_PROTOCOLS.has(scheme);
};

const getAnchorHref = (anchor: Element): string | null => {
	return anchor.getAttribute("href") ?? anchor.getAttribute("xlink:href");
};

export const isEditableProseMirrorAnchor = (anchor: Element): boolean => {
	return !!anchor.closest('.ProseMirror[contenteditable="true"]');
};

const getExternalHrefFromEvent = (event: MouseEvent): string | null => {
	if (!(event.target instanceof Element)) return null;

	const anchor = event.target.closest("a");
	if (!anchor || anchor.hasAttribute("download")) return null;
	if (isEditableProseMirrorAnchor(anchor)) return null;

	const href = getAnchorHref(anchor);
	return isTauriExternalHref(href) ? href : null;
};

const useTauriExternalLinkInterceptor = () => {
	const { isTauri } = usePlatform();

	useEffect(() => {
		if (!isTauri || typeof document === "undefined") return;

		const openInWeb = resolveModule("openInWeb");
		const handleClick = (event: MouseEvent) => {
			if (event.defaultPrevented) return;

			const href = getExternalHrefFromEvent(event);
			if (!href) return;

			event.preventDefault();
			event.stopPropagation();
			void openInWeb(href);
		};

		document.addEventListener("click", handleClick, true);

		return () => document.removeEventListener("click", handleClick, true);
	}, [isTauri]);
};

export default useTauriExternalLinkInterceptor;
