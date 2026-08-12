import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import isSafari from "@core-ui/utils/isSafari";
// biome-ignore lint/style/noRestrictedImports: PDF print layout still relies on dynamic scoped Emotion styles.
import styled from "@emotion/styled";
import UiLanguage, { ContentLanguage } from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import NavigationEventsService from "@ext/navigation/NavigationEvents";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NO_PRINT_KEY, PAGE_HEIGHT_PDF, PAGE_WIDTH_PDF } from "../const";
import type { PdfExportProgress, PdfPrintParams } from "../types";
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

const isPrintDialogDisabled = (): boolean => {
	try {
		const value = window.localStorage?.getItem(NO_PRINT_KEY)?.trim().toLowerCase();
		// This switch is set by hand in a console, so "0" and "false" have to mean off. getItem answers with
		// strings and every non-empty one is truthy, which would otherwise turn the switch on for whoever
		// tried to turn it off.
		return !!value && value !== "0" && value !== "false";
	} catch {
		return false;
	}
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

	const contentLanguage = PageDataContextService.value.language.content || catalogProps.language;
	const defaultTocPageTitle =
		contentLanguage === ContentLanguage.ru
			? t("export.pdf.tocPageTitle", UiLanguage.ru)
			: t("export.pdf.tocPageTitle", UiLanguage.en);
	const printParams = useMemo(
		() => ({
			...params,
			tocPageTitle: params.tocPageTitle ?? defaultTocPageTitle,
		}),
		[defaultTocPageTitle, params],
	);

	// Only ever true once pagination is over. Until then this component must lay out exactly as it does for a
	// real print run -- the paginator measures what it sees, so dressing the view up early changes the page
	// breaks it computes, and hiding the copy it measures leaves it with nothing to deal out at all.
	const [showDebugPreview, setShowDebugPreview] = useState(false);

	const handleDone = useCallback(async () => {
		try {
			onProgress?.({ stage: "printing", ratio: 1, cliMessage: "done" });
			// The dev switch stops here: no browser dialog, and since onComplete is what tears the view down,
			// the paginated pages stay on screen to be looked at. Closing is the button below. Read at call
			// time, so flipping the switch takes effect on the next export without a reload.
			if (isPrintDialogDisabled()) {
				setShowDebugPreview(true);
				return;
			}
			await new Promise<void>((resolve) => setTimeout(resolve, 50));
			window.print();
			onComplete?.();
		} catch (error) {
			onError(error);
			return;
		}
	}, [onError, onComplete, onProgress]);

	useEffect(() => {
		if (!showDebugPreview) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") ArticleViewService.setDefaultBottomView();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [showDebugPreview]);

	const { start, cancel } = usePaginationTask({
		apiUrlCreator,
		params: printParams,
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
		<div className={`article-body ${className}${showDebugPreview ? " print-debug-preview" : ""}`}>
			{showDebugPreview && (
				<button
					aria-label={t("close")}
					className="print-debug-close"
					onClick={() => ArticleViewService.setDefaultBottomView()}
					type="button"
				>
					×
				</button>
			)}
			<PrintPages
				apiUrlCreator={apiUrlCreator}
				catalogProps={catalogProps}
				exportSignal={exportSignal}
				isCategory={isCategory}
				itemPath={itemPath}
				onCancelPagination={cancel}
				onProgress={onProgress}
				onStartPagination={start}
				params={printParams}
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

	/* Scoped to direct children on purpose. A page box is always one: PrintPages renders .render-body > .page
	   for measuring, and the paginator appends .page to .print-body. Written as a bare .page this also caught
	   any .page inside the article content -- @gramax/openapi-viewer names its own document container
	   <main class="page">, and it was being forced to 900x1350 with a page's padding, so an OpenAPI block
	   reserved a full sheet of empty space no matter how short it was, and the export ended on a blank page. */
	& :is(.render-body, .print-body) > .page {
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

	${(p) =>
		p.catalogProps.resolvedView
			? `
				[data-component="tabs"]:has(> .tabs > .tab:only-child) > .tabs > .tab > .case {
					display: none !important;
				}
			`
			: ""}

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

	/* Under NO_PRINT the paginated pages stay on screen instead of going to the printer -- which means
	   everything the print stylesheet would have done has to be done here, because @media print never runs.

	   Fixed positioning does all of it at once. In the flow this element is a flex item of the article
	   column, and the article above has already claimed the full height: the box collapses to zero and its
	   own overflow clips all 1350px of every page out of sight. That is the "nothing happens" a reader
	   reports -- and it is invisible to a query, because the pages inside still report honest geometry.
	   Taking the element out of the flow also lets it paint over the two things printing removes rather
	   than reflows: the export dialog's full-screen overlay, which paper drops via its print:hidden, and
	   the article itself. Covering the viewport opaquely settles all three.

	   No backticks in this comment: it lives inside a template literal, and one would end it. */
	&.print-debug-preview {
		position: fixed;
		inset: 0;
		/* Above the dialog overlay's z-50; the close button sits above this in turn. */
		z-index: 60;
		overflow: auto;
		background: var(--color-article-bg);

		.render-body {
			display: none;
		}

		.print-debug-close {
			position: fixed;
			top: 1rem;
			right: 1rem;
			z-index: 100;
			width: 2rem;
			height: 2rem;
			font-size: 1.25rem;
			line-height: 1;
			cursor: pointer;
			color: var(--color-primary-general);
			background: var(--color-article-bg);
			border: 1px solid var(--color-line);
			border-radius: var(--radius-large);
		}
	}

	@media print {
		print-color-adjust: exact;
		visibility: visible;
		height: auto !important;
		overflow: visible !important;

		/* The debug preview is scaffolding for the screen. On paper it must leave no trace, so that pressing
		   Cmd+P on it -- or emulating print media in a test -- shows the real output and not the scaffolding. */
		&.print-debug-preview {
			position: static;
			background: none;
			z-index: auto;

			.print-debug-close {
				display: none;
			}
		}

		* {
			break-before: unset !important;
		}

		@page {
			margin: 0;
			padding: 0;
		}

		& :is(.render-body, .print-body) > .page {
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
