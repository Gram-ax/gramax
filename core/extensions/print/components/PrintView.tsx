import { useDismissableToast } from "@components/Atoms/DismissableToast";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import isSafari from "@core-ui/utils/isSafari";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import NavigationEventsService from "@ext/navigation/NavigationEvents";
import { Loader } from "ics-ui-kit/components/loader";
import { useEffect } from "react";
import { PAGE_HEIGHT, PAGE_HEIGHT_PDF, PAGE_WIDTH, PAGE_WIDTH_PDF } from "../const";
import { PrintMode } from "../types";
import PrintPages from "./PrintPages";

type PrintViewProps = {
	itemPath?: string;
	isCategory?: boolean;
	printMode: PrintMode;
	catalogProps: ClientCatalogProps;
	apiUrlCreator: ApiUrlCreator;
	className?: string;
};

const PrintView = ({ itemPath, isCategory, catalogProps, apiUrlCreator, printMode, className }: PrintViewProps) => {
	const { dismiss, show } = useDismissableToast({
		title: t("export.pdf.process"),
		closeAction: false,
		focus: "medium",
		size: "sm",
		status: "info",
		primaryAction: <Loader size="md" />,
	});

	useEffect(() => {
		show();
		const listener = () => ArticleViewService.setDefaultBottomView();

		const token = NavigationEventsService.on("item-click", listener);

		return () => NavigationEventsService.off(token);
	}, []);

	return (
		<div className={`article-body ${className}`}>
			<PrintPages
				itemPath={itemPath}
				isCategory={isCategory}
				printMode={printMode}
				catalogProps={catalogProps}
				apiUrlCreator={apiUrlCreator}
				onDone={() => {
					dismiss.current?.();
					setTimeout(() => {
						window.print();
					}, 300);
					setTimeout(() => {
						ArticleViewService.setDefaultBottomView();
					}, 3000);
				}}
			/>
		</div>
	);
};

export default styled(PrintView)`
	overflow: scroll;
	visibility: hidden;
	height: 0px !important;

	&,
	.print-body {
		min-width: ${PAGE_WIDTH_PDF}px !important;
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	.page:first-child {
		page-break-before: unset !important;
	}

	.page {
		margin: 2rem 0;
		padding: 3rem;
		overflow: hidden;
		box-sizing: border-box;
		border: 1px solid #ccc;
		page-break-before: always;
		width: ${PAGE_WIDTH}px;
		height: ${PAGE_HEIGHT}px;
		padding-top: ${isSafari() ? "90px" : "2rem"} !important;

		* {
			color: #000 !important;
			border-color: rgba(0, 0, 0, 0.13) !important;
		}
	}

	table[data-header="row"] tbody tr:first-child td {
		font-weight: 300;
		color: var(--color-article-text);
	}

	@media print {
		visibility: visible;
		height: auto !important;
		overflow: visible !important;

		@page {
			margin: 0;
			padding: 0;
		}

		.page {
			margin: 0;
			padding: 0;
			border: none;
			padding-right: 3rem;
			height: ${PAGE_HEIGHT_PDF}px !important;
		}

		.render-body {
			display: none;
		}
	}
`;
