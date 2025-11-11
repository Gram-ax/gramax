import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { PdfExportProgress } from "@ext/print/types";
import { useCallback, useRef, useState } from "react";

const clampPercent = (ratio?: number | null) => {
	if (ratio === undefined || ratio === null) return 0;
	return Math.min(Math.max(Math.ceil(ratio * 100), 0), 100);
};

export function useExportPdf({ onClose }: { onClose?: () => void }) {
	const [open, setOpen] = useState(true);
	const [isExporting, setIsExporting] = useState(false);
	const [progress, setProgress] = useState<PdfExportProgress | null>(null);
	const skipCloseCleanupRef = useRef(false);
	const cancelTaskRef = useRef<(() => void) | null>(null);
	const isCancellingRef = useRef(false);

	const handleProgress = useCallback((value: PdfExportProgress) => {
		if (isCancellingRef.current && value.stage !== "cancelled") {
			return;
		}

		if (value.stage === "cancelled") {
			cancelTaskRef.current = null;
			isCancellingRef.current = false;
			setIsExporting(false);
			setProgress(null);
			ArticleViewService.setDefaultBottomView();
			return;
		}

		setProgress(value);

		if (value.stage === "printing") {
			const closeModal = () => {
				skipCloseCleanupRef.current = true;
				ModalToOpenService.resetValue();
				setOpen(false);
			};

			if (typeof window !== "undefined" && window.requestAnimationFrame) {
				window.requestAnimationFrame(closeModal);
			} else {
				closeModal();
			}
		}
	}, []);

	const handleComplete = useCallback(() => {
		isCancellingRef.current = false;
		ModalToOpenService.resetValue();
		setIsExporting(false);
		setProgress(null);
		cancelTaskRef.current = null;
		setOpen(false);
		onClose?.();
	}, [onClose]);

	const handleError = useCallback((error: Error) => {
		isCancellingRef.current = false;
		ArticleViewService.setDefaultBottomView();
		setIsExporting(false);
		cancelTaskRef.current = null;
		setOpen(false);
		ErrorConfirmService.notify(
			new DefaultError(
				t("export.pdf.error.message"),
				error,
				{ showCause: true },
				false,
				t("export.pdf.error.title"),
			),
		);
	}, []);

	const onOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen && skipCloseCleanupRef.current) {
				setOpen(nextOpen);
				skipCloseCleanupRef.current = false;
				return;
			}

			if (!nextOpen && isExporting) {
				isCancellingRef.current = true;
				setProgress((p) => ({
					stage: "cancelled",
					ratio: p?.ratio ?? 0,
				}));
				setTimeout(() => {
					cancelTaskRef.current?.();
				}, 0);
				return;
			}

			setOpen(nextOpen);

			if (!nextOpen) {
				isCancellingRef.current = false;
				ModalToOpenService.resetValue();
				ArticleViewService.setDefaultBottomView();
				onClose?.();
				setProgress(null);
				cancelTaskRef.current = null;
			}
		},
		[isExporting, onClose],
	);

	return {
		// state
		open,
		isExporting,
		progress,
		// derived
		progressLabel:
			progress?.stage === "cancelled"
				? t("export.pdf.canceled")
				: `${t("export.pdf.process")} ${clampPercent(progress?.ratio)}%`,
		percent: clampPercent(progress?.ratio),
		// refs
		cancelTaskRef,
		// handlers
		setIsExporting,
		setProgress,
		handleProgress,
		handleComplete,
		handleError,
		onOpenChange,
		setOpen,
	} as const;
}
