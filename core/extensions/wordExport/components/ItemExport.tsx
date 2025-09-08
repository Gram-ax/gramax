import { useDismissableToast } from "@components/Atoms/DismissableToast";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { downloadFile } from "@core-ui/downloadResource";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { CancelableFunction } from "@core/utils/CancelableFunction";
import { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import PrintView from "@ext/print/components/PrintView";
import { feature } from "@ext/toggleFeatures/features";
import DropdownButton from "@ext/wordExport/components/DropdownButton";
import { Loader } from "ics-ui-kit/components/loader";
import { useMemo, useRef, useState } from "react";
import CommonUnsupportedElementsModal from "@ext/import/components/CommonUnsupportedElementsModal";
import PureLink from "@components/Atoms/PureLink";
import { Button } from "@ui-kit/Button";

interface ItemExportProps {
	fileName: string;
	itemRefPath?: string;
	isCategory?: boolean;
	exportFormat: ExportFormat;
}

export enum ExportFormat {
	pdf = "pdf",
	docx = "docx",
}

const TemplateHeader = () => {
	return (
		<div
			className="disabled"
			style={{
				cursor: "default",
				width: "100%",
				padding: "5px 10px",
				textTransform: "uppercase",
				color: "var(--color-loader)",
				fontWeight: 450,
				fontSize: 12,
			}}
		>
			{t("word.template.templates")}
		</div>
	);
};

const ItemExport = ({ fileName, itemRefPath, isCategory, exportFormat }: ItemExportProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [errorWordElements, setErrorWordElements] = useState<UnsupportedElements[]>([]);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext, isStatic, isTauri } = usePlatform();
	const ref = useRef();

	const templates = PageDataContextService.value.wordTemplates;
	const domain = PageDataContextService.value.domain;

	const { dismiss, show } = useDismissableToast({
		title: t(exportFormat === ExportFormat.pdf ? "export.pdf.process" : "export.docx.process"),
		closeAction: false,
		focus: "medium",
		size: "sm",
		status: "info",
		primaryAction: <Loader size="md" />,
	});

	const selectedTemplateRef = useRef<string>(null);

	const currentCancelableRef = useRef<CancelableFunction<void>>();

	const cancelableFunction = useMemo(
		() => (template?: string) =>
			new CancelableFunction<void>(async (signal) => {
				const res =
					exportFormat === ExportFormat.pdf
						? await FetchService.fetch(apiUrlCreator.getPdfSaveUrl(isCategory, itemRefPath))
						: await FetchService.fetch(apiUrlCreator.getWordSaveUrl(isCategory, itemRefPath, template));
				if (!res.ok || signal.aborted) return;
				downloadFile(
					isNext || isStatic ? await res.buffer() : res.body,
					exportFormat === ExportFormat.docx ? MimeTypes.docx : MimeTypes.pdf,
					fileName,
				);
			}),
		[fileName],
	);

	const startDownload = (template?: string) => {
		setIsDownloading(true);
		setIsOpen(false);
		show();

		const tpl = template ?? selectedTemplateRef.current;

		const cf = cancelableFunction(tpl);
		currentCancelableRef.current = cf;
		cf.start().finally(() => {
			setIsDownloading(false);
			dismiss?.current();
			setIsOpen(false);
			setErrorWordElements([]);
			selectedTemplateRef.current = undefined;
		});
	};

	const getErrorElementsUrl = (format: ExportFormat, isCategory: boolean, itemPath: string) => {
		return apiUrlCreator.getErrorWordElementsUrl(isCategory, itemPath, format);
	};

	const onOpen = async (templateParam?: string) => {
		selectedTemplateRef.current = templateParam;
		const url = getErrorElementsUrl(exportFormat, isCategory, itemRefPath);
		const res = await FetchService.fetch<UnsupportedElements[]>(url);

		if (!res.ok) {
			setIsOpen(false);
			return;
		}
		const errorWordElements = await res.json();
		setErrorWordElements(errorWordElements);
		if (errorWordElements.length > 0) {
			setIsOpen(true);
			return;
		}
		startDownload(templateParam);
	};

	const getExportText = () => {
		if (itemRefPath) {
			return isCategory
				? exportFormat === ExportFormat.pdf
					? t("export.pdf.category")
					: t("export.docx.category")
				: exportFormat === ExportFormat.pdf
				? t("export.pdf.article")
				: t("export.docx.article");
		}
		return exportFormat === ExportFormat.pdf ? t("export.pdf.catalog") : t("export.docx.catalog");
	};

	const renderExportButton = useMemo(() => {
		if (exportFormat === ExportFormat.docx && templates.length > 0) {
			return (
				<PopupMenuLayout
					appendTo={() => ref.current}
					offset={[10, -5]}
					popperOptions={{
						modifiers: [
							{ name: "flip", enabled: false },
							{ name: "preventOverflow", enabled: false },
						],
					}}
					placement="right-start"
					className="wrapper"
					openTrigger="mouseenter focus"
					trigger={<DropdownButton iconCode="file-text" ref={ref} text={getExportText()} />}
				>
					<>
						<ButtonLink
							iconCode="file-text"
							text={t("word.template.no-template")}
							onClick={() => {
								void onOpen(undefined);
							}}
						/>
						<TemplateHeader />
						{templates?.map((template) => (
							<ButtonLink
								key={template}
								iconCode="file-text"
								text={template.split(".")[0]}
								onClick={() => {
									void onOpen(template);
								}}
							/>
						))}
					</>
				</PopupMenuLayout>
			);
		}

		return (
			<ButtonLink
				iconCode="file-text"
				text={getExportText()}
				onClick={() => {
					void onOpen();
				}}
				iconIsLoading={isDownloading}
			/>
		);
	}, [exportFormat, getExportText, templates, isDownloading]);

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			if (isDownloading) currentCancelableRef.current?.abort();
			selectedTemplateRef.current = undefined;
		}
	};

	const renderArticleLink = ({ title, link }: { title: string; link: string }) => {
		return !isTauri ? (
			<PureLink href={domain + "/" + link}>
				<Button variant="link" status="default" className="p-0">
					{title}
				</Button>
			</PureLink>
		) : (
			<p style={{ margin: "0" }}>{title}</p>
		);
	};

	return (
		<>
			{renderExportButton}
			<CommonUnsupportedElementsModal
				open={isOpen}
				title={t("unsupported-elements-title")}
				description={`${
					exportFormat === ExportFormat.pdf
						? t("unsupported-elements-warning1-pdf")
						: t("unsupported-elements-warning1")
				} ${t("unsupported-elements-warning3")}`}
				onOpenChange={onOpenChange}
				unsupportedElements={errorWordElements}
				onContinue={() => startDownload(selectedTemplateRef.current)}
				isLoading={isDownloading}
				firstColumnTitle={t("article2")}
				renderArticleLink={renderArticleLink}
			/>
		</>
	);
};

const PdfExportButton = ({ itemRefPath, isCategory }: { itemRefPath?: string; isCategory?: boolean }) => {
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onClick = () => {
		ArticleViewService.setBottomView(() => (
			<PrintView
				printMode={"pdf"}
				isCategory={isCategory}
				catalogProps={catalogProps}
				itemPath={itemRefPath}
				apiUrlCreator={apiUrlCreator}
			/>
		));
	};

	return (
		<ButtonLink
			iconCode="file-text"
			text={
				itemRefPath
					? isCategory
						? t("export.pdf.category")
						: t("export.pdf.article")
					: t("export.pdf.catalog")
			}
			onClick={onClick}
		/>
	);
};

export default (props: ItemExportProps) => {
	if (props.exportFormat === ExportFormat.pdf && feature("export-pdf")) {
		return <PdfExportButton itemRefPath={props.itemRefPath} isCategory={props.isCategory} />;
	}
	return <ItemExport {...props} />;
};
