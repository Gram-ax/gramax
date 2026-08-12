import { DATA_QA_LIGHTBOX } from "@components/Atoms/Image/modalImage/MediaPreview";
import type Path from "@core/FileProvider/Path/Path";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import {
	FilePreview,
	type FilePreviewMeta,
	type FilePreviewProps,
} from "@ext/markdown/elements/file/edit/components/Preview/FilePreview";
import { FilePreviewModalProvider } from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewModalContext";
import { FilePreviewModalFooter } from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewModalFooter";
import { FilePreviewModalHeader } from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewModalHeader";
import { Overlay } from "@ui-kit/Overlay";
import { type MouseEventHandler, type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PreviewModalProps extends FilePreviewProps {
	path: Path;
	className?: string;
	openInSupportedApp?: () => void;
	onClose: () => void;
	onError?: (error: unknown) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(zoom.toFixed(2))));

const PreviewModal = (props: PreviewModalProps): ReactElement => {
	const { className, onClose, file, path, openInSupportedApp, onError: onErrorProps } = props;
	const [isClosing, setClosing] = useState<boolean>(false);
	const [meta, setMeta] = useState<FilePreviewMeta>({});
	const [selectedSheetName, setSelectedSheetName] = useState<string>();
	const [zoom, setZoom] = useState(1);
	const previewBodyRef = useRef<HTMLDivElement>(null);

	const closeModal = useCallback(
		(immediately?: boolean) => {
			if (immediately) return onClose();
			setClosing(true);
			onClose?.();
		},
		[onClose],
	);

	const onClick: MouseEventHandler<HTMLDivElement> = useCallback(
		(event) => {
			const target = event.target as HTMLElement;
			if (target.classList.contains("data-close")) return closeModal();
		},
		[closeModal],
	);

	const onKeyDown = useCallback(
		(ev: KeyboardEvent) => {
			if (ev.key === "Escape") closeModal();
		},
		[closeModal],
	);

	useEffect(() => {
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [onKeyDown]);

	const onError = useCallback(
		(error: unknown) => {
			closeModal();
			onErrorProps?.(error);
		},
		[onErrorProps, closeModal],
	);

	const onMetaChange = useCallback((nextMeta: Partial<FilePreviewMeta>) => {
		setMeta((currentMeta) => ({ ...currentMeta, ...nextMeta }));
	}, []);

	const pageItems = useMemo(() => {
		if (!meta.pageCount) return [];
		return Array.from({ length: meta.pageCount }, (_, index) => index + 1);
	}, [meta.pageCount]);

	const activePage = meta.currentPage ?? 1;
	const hasPageNavigation = pageItems.length > 1;
	const sheetItems = meta.sheetNames ?? [];
	const hasSheetNavigation = sheetItems.length > 1;
	const lastPage = meta.pageCount ?? 1;

	const goToPage = useCallback((page: number) => {
		const target = previewBodyRef.current?.querySelector<HTMLElement>(`[data-preview-page="${page}"]`);
		target?.scrollIntoView({ block: "start", behavior: "smooth" });
		setMeta((currentMeta) => ({ ...currentMeta, currentPage: page }));
	}, []);

	const goToSelectedPage = useCallback(
		(page: string) => {
			goToPage(Number(page));
		},
		[goToPage],
	);

	const goToPreviousPage = useCallback(() => {
		goToPage(Math.max(1, activePage - 1));
	}, [activePage, goToPage]);

	const goToNextPage = useCallback(() => {
		goToPage(Math.min(lastPage, activePage + 1));
	}, [activePage, goToPage, lastPage]);

	const updateZoom = useCallback((delta: number) => {
		setZoom((currentZoom) => clampZoom(currentZoom + delta));
	}, []);

	const selectSheet = useCallback((sheetName: string) => {
		setSelectedSheetName(sheetName);
		setMeta((currentMeta) => ({ ...currentMeta, sheetName }));
	}, []);

	const context = useMemo(
		() => ({
			activePage,
			closeModal: () => closeModal(),
			file,
			goToNextPage,
			goToPreviousPage,
			goToSelectedPage,
			hasPageNavigation,
			hasSheetNavigation,
			lastPage,
			maxZoom: MAX_ZOOM,
			meta,
			minZoom: MIN_ZOOM,
			openInSupportedApp,
			pageItems,
			path,
			selectSheet,
			selectedSheetName,
			sheetItems,
			zoom,
			zoomIn: () => updateZoom(ZOOM_STEP),
			zoomOut: () => updateZoom(-ZOOM_STEP),
		}),
		[
			activePage,
			closeModal,
			file,
			goToNextPage,
			goToPreviousPage,
			goToSelectedPage,
			hasPageNavigation,
			hasSheetNavigation,
			lastPage,
			meta,
			openInSupportedApp,
			pageItems,
			path,
			selectSheet,
			selectedSheetName,
			sheetItems,
			zoom,
			updateZoom,
		],
	);

	return (
		<div
			className={cn(
				"pointer-events-auto fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center",
				className,
			)}
			data-qa={DATA_QA_LIGHTBOX}
			onClick={onClick}
		>
			<div
				className={cn(
					"relative flex h-full w-full items-center justify-center p-6 max-[860px]:p-2.5",
					isClosing
						? "animate-out fade-out-0 pointer-events-none"
						: "animate-in fade-in-0 pointer-events-auto",
				)}
			>
				<Overlay blur className="data-close" data-state={isClosing ? "closed" : "open"} />
				<section
					aria-label={t("file-preview.title").toString()}
					className="relative z-[51] grid h-[min(92vh,900px)] w-[min(96vw,1320px)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-lg border border-primary-border bg-secondary-bg text-primary-fg shadow-soft-xl max-[860px]:h-[calc(100vh-20px)] max-[860px]:w-[calc(100vw-20px)]"
				>
					<FilePreviewModalProvider value={context}>
						<FilePreviewModalHeader />
						<div className="grid min-h-0 grid-cols-[minmax(0,1fr)] bg-primary-bg">
							<div className="min-h-0 min-w-0 overflow-auto p-6 max-[860px]:p-3" ref={previewBodyRef}>
								<FilePreview
									file={file}
									onError={onError}
									onMetaChange={onMetaChange}
									selectedSheetName={selectedSheetName}
									zoom={zoom}
								/>
							</div>
						</div>
						<FilePreviewModalFooter />
					</FilePreviewModalProvider>
				</section>
			</div>
		</div>
	);
};

export default PreviewModal;
