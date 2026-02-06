import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import isSafari from "@core-ui/utils/isSafari";
import styled from "@emotion/styled";
import NavigationEventsService from "@ext/navigation/NavigationEvents";
import { useCallback, useEffect } from "react";
import { PAGE_HEIGHT_PDF, PAGE_WIDTH_PDF } from "../const";
import { PdfExportProgress, PdfPrintParams } from "../types";
import { usePaginationTask } from "./hooks/usePaginationTask";
import PrintPages from "./PrintPages";

type PrintViewProps = {
	itemPath?: string;
	isCategory?: boolean;
	catalogProps: ClientCatalogProps;
	apiUrlCreator: ApiUrlCreator;
	params: PdfPrintParams;
	openPrint?: boolean;
	className?: string;
	onProgress?: (progress: PdfExportProgress) => void;
	onComplete?: () => void;
	onError?: (error: Error) => void;
	onCancelRef?: (cancel?: () => void) => void;
	exportSignal?: AbortSignal;
	throttleUnits?: number;
};

const PrintView = ({
	itemPath,
	isCategory,
	catalogProps,
	apiUrlCreator,
	params,
	className,
	onProgress,
	onComplete,
	onError,
	onCancelRef,
	exportSignal,
	throttleUnits,
}: PrintViewProps) => {
	useEffect(() => {
		const listener = () => ArticleViewService.setDefaultBottomView();
		const token = NavigationEventsService.on("item-click", listener);
		return () => NavigationEventsService.off(token);
	}, []);

	const handleDone = useCallback(async () => {
		try {
			onProgress?.({ stage: "printing", ratio: 1, cliMessage: "done" });
			await new Promise<void>((resolve) => setTimeout(resolve, 50));
			window.print();
			onComplete?.();
		} catch (error) {
			onError(error);
			return;
		}
	}, [onError, onComplete, onProgress]);

	const { start, cancel } = usePaginationTask({
		apiUrlCreator,
		params,
		onProgress,
		onDone: handleDone,
		onError,
		externalSignal: exportSignal,
		throttleUnits,
	});

	useEffect(() => {
		onCancelRef?.(() => cancel());
		return () => {
			cancel();
			onCancelRef?.(undefined);
		};
	}, [cancel, onCancelRef]);

	return (
		<div className={`article-body ${className}`}>
			<PrintPages
				apiUrlCreator={apiUrlCreator}
				catalogProps={catalogProps}
				isCategory={isCategory}
				itemPath={itemPath}
				onCancelPagination={cancel}
				onProgress={onProgress}
				onStartPagination={start}
				params={params}
			/>
		</div>
	);
};

export default styled(PrintView)`
	overflow: auto;
	visibility: visible;
	height: auto !important;

	&,
	.print-body {
		min-width: ${PAGE_WIDTH_PDF}px !important;
	}

	.page {
		margin: 0;
		padding: 0;
		overflow: hidden;
		box-sizing: border-box;
		border: 1px solid #ccc;
		page-break-before: always;
		width: ${PAGE_WIDTH_PDF}px;
		height: ${PAGE_HEIGHT_PDF}px;
		padding-top: ${isSafari() ? "90px" : "2rem"} !important;
		padding-bottom: ${isSafari() ? "90px" : "2rem"} !important;
		display: flex;
		flex-direction: column;

		.page-top,
		.page-bottom {
			flex-shrink: 0;
			min-height: 0;
			display: flex;
			justify-content: space-between;
		}

		.page-content {
			flex: 1;
			overflow: hidden;
			li.no-marker {
				&::before,
				&.task-item > label {
					display: none;
				}
			}

			h1 {
				break-before: page;
			}
		}
	}

	table[data-header] tbody tr td:not(.cell-header) {
		font-weight: inherit;
		color: var(--color-article-text);
	}

	.toc-page {
		flex: 0 0 auto;
		text-decoration: none;

		.toc-page-items {
			margin: 0;
			padding: 0;
			list-style: none;
			padding-left: 0 !important;

			.toc-item-link {
				position: relative;
				display: flex;
				align-items: baseline;
				text-decoration: none;
				width: 100%;
				color: inherit;

				.toc-item-right {
					position: absolute;
					right: 0;
					display: flex;
					align-items: baseline;
					bottom: 0;
				}

				.toc-item-dots {
					width: 100%;
					--size: 2px;
					--gap: 4px;
					--step: calc(var(--size) + var(--gap));
					height: var(--size);
					margin: 0 0.5ch;

					padding-inline: calc(var(--size) / 2);
					background-image: linear-gradient(to right, currentColor 0 var(--size), transparent 0);
					background-size: var(--step) var(--size);
					background-origin: content-box;
					background-clip: content-box;
				}

				.toc-item-number {
					flex-shrink: 0;
				}
			}
		}

		li::before {
			${(p) => (p.params.titleNumber ? "display: none !important" : "")};
		}
	}

	.title-page {
		display: flex;
		position: relative;
		flex-direction: column;
		justify-content: center;

		.title-page-top,
		.title-page-bottom {
			top: 0;
			left: 0;
			width: 100%;
			height: 150px;
			display: flex;
			position: absolute;
			align-items: center;
			justify-content: space-between;
		}

		.title-page-bottom {
			top: unset;
			bottom: 0;
		}

		.title-page-header {
			font-size: 65px;
			font-weight: 400;
		}
	}

	@media print {
		print-color-adjust: exact;
		visibility: visible;
		height: auto !important;
		overflow: visible !important;

		* {
			break-before: unset !important;
		}

		@page {
			margin: 0;
			padding: 0;
		}

		.page {
			border: none;

			.page-bottom {
				margin-top: -36px;
			}
		}

		.render-body {
			display: none;
		}
	}
`;
