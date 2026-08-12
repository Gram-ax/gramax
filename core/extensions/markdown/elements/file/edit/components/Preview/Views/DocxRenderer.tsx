import { cn } from "@core-ui/utils/cn";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RendererProps } from "../FilePreview";

const DocxRenderer = ({ file, onLoad, onError, onMetaChange }: RendererProps) => {
	const [pageCount, setPageCount] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const pageRefs = useRef<HTMLElement[]>([]);

	const setupPages = useCallback(() => {
		if (!ref.current) return;

		const pages = Array.from(ref.current.querySelectorAll<HTMLElement>(".docx-wrapper > section"));
		pageRefs.current = pages;
		pages.forEach((page, index) => {
			page.dataset.previewPage = String(index + 1);
		});

		setPageCount(pages.length);
		onMetaChange?.({
			currentPage: pages.length ? 1 : undefined,
			pageCount: pages.length || undefined,
			sheetCount: undefined,
			sheetName: undefined,
		});
	}, [onMetaChange]);

	const render = useCallback(
		async (file: File) => {
			if (!ref.current) return;
			try {
				const { renderAsync } = await import("docx-preview");
				ref.current.innerHTML = "";
				await renderAsync(file, ref.current);
				setupPages();
			} catch (error) {
				onError?.(error);
			} finally {
				onLoad?.();
			}
		},
		[onLoad, onError, setupPages],
	);

	useEffect(() => {
		if (!ref.current) return;
		if (file) void render(file);
	}, [file, render]);

	useEffect(() => {
		if (!pageCount) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
				if (!visible) return;

				const currentPage = Number((visible.target as HTMLElement).dataset.previewPage);
				if (currentPage) onMetaChange?.({ currentPage });
			},
			{ threshold: [0.25, 0.5, 0.75] },
		);

		pageRefs.current.forEach((page) => observer.observe(page));

		return () => observer.disconnect();
	}, [pageCount, onMetaChange]);

	return (
		<div
			className={cn(
				"flex min-h-full w-full justify-center overflow-visible",
				"[&_.docx-wrapper]:flex [&_.docx-wrapper]:w-full [&_.docx-wrapper]:flex-col [&_.docx-wrapper]:items-center",
				"[&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:[padding:unset] [&_.docx-wrapper>section]:!mx-0 [&_.docx-wrapper>section]:![max-width:min(100%,210mm)]",
				"[&_.docx-wrapper>section]:!bg-secondary-bg [&_.docx-wrapper>section]:!shadow-soft-xl",
				"[&_.docx-wrapper>section_*]:text-primary-fg",
			)}
			ref={ref}
		/>
	);
};

export default DocxRenderer;
