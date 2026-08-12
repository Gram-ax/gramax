import t from "@ext/localization/locale/translate";
import { useFilePreviewModalContext } from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewModalContext";
import { IconButton } from "@ui-kit/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import type { ReactElement } from "react";
import { tv } from "tailwind-variants";

const selectStyles = tv({
	slots: {
		trigger: "min-w-0 max-w-[45vw] bg-transparent [&>span]:truncate",
		content: "max-w-[min(320px,calc(100vw-32px))]",
		item: "max-w-full pr-8 [&>span:last-child]:block [&>span:last-child]:min-w-0 [&>span:last-child]:truncate",
	},
});

export const FilePreviewModalFooter = (): ReactElement => {
	const {
		activePage,
		goToNextPage,
		goToPreviousPage,
		goToSelectedPage,
		hasPageNavigation,
		hasSheetNavigation,
		lastPage,
		maxZoom,
		meta,
		minZoom,
		pageItems,
		selectSheet,
		selectedSheetName,
		sheetItems,
		zoom,
		zoomIn,
		zoomOut,
	} = useFilePreviewModalContext();
	const styles = selectStyles();
	const { pageCount, sheetName } = meta;
	const pageLabel = pageCount ? `${t("file-preview.page")} ${activePage} ${t("file-preview.of")} ${pageCount}` : null;
	const sheetLabel = sheetName ? `${t("file-preview.sheet")} ${sheetName}` : null;

	return (
		<footer className="flex min-h-[54px] items-center justify-between gap-4 border-t border-primary-border bg-secondary-bg px-5 py-2.5 max-[860px]:flex-wrap max-[860px]:px-3 max-[860px]:py-2">
			<div className="flex min-w-0 items-center gap-1.5">
				{hasPageNavigation ? (
					<>
						<IconButton
							aria-label={t("pagination.previous").toString()}
							disabled={activePage <= 1}
							icon="chevron-left"
							onClick={goToPreviousPage}
							type="button"
							variant="text"
						/>
						<Select onValueChange={goToSelectedPage} value={String(activePage)}>
							<SelectTrigger className={styles.trigger()}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className={styles.content()}>
								{pageItems.map((page) => (
									<SelectItem className={styles.item()} key={page} value={String(page)}>
										{t("file-preview.page")} {page} {t("file-preview.of")} {pageCount}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<IconButton
							aria-label={t("pagination.next").toString()}
							disabled={activePage >= lastPage}
							icon="chevron-right"
							onClick={goToNextPage}
							type="button"
							variant="text"
						/>
					</>
				) : hasSheetNavigation ? (
					<Select onValueChange={selectSheet} value={selectedSheetName ?? sheetName}>
						<SelectTrigger className={styles.trigger()}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className={styles.content()}>
							{sheetItems.map((sheetName) => (
								<SelectItem className={styles.item()} key={sheetName} value={sheetName}>
									{sheetName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<div className="text-sm font-medium text-primary-fg">
						{pageLabel || sheetLabel || t("file-preview.ready")}
					</div>
				)}
			</div>
			<div className="flex shrink-0 items-center gap-1.5">
				<IconButton
					aria-label={t("file-preview.zoom-out").toString()}
					disabled={zoom <= minZoom}
					icon="zoom-out"
					onClick={zoomOut}
					title={t("file-preview.zoom-out").toString()}
					type="button"
					variant="text"
				/>
				<span className="min-w-[52px] text-center text-sm font-medium">{Math.round(zoom * 100)}%</span>
				<IconButton
					aria-label={t("file-preview.zoom-in").toString()}
					disabled={zoom >= maxZoom}
					icon="zoom-in"
					onClick={zoomIn}
					title={t("file-preview.zoom-in").toString()}
					type="button"
					variant="text"
				/>
			</div>
		</footer>
	);
};
