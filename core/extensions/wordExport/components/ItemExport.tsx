import { useDismissableToast } from "@components/Atoms/DismissableToast";
import PureLink from "@components/Atoms/PureLink";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { downloadFile } from "@core-ui/downloadResource";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { CancelableFunction } from "@core/utils/CancelableFunction";
import CommonUnsupportedElementsModal from "@ext/import/components/CommonUnsupportedElementsModal";
import UnsupportedElements from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import DropdownButton from "@ext/wordExport/components/DropdownButton";
import { Loader } from "ics-ui-kit/components/loader";
import { useMemo, useRef, useState } from "react";

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
	const [selectedTemplate, setSelectedTemplate] = useState<string>();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext, isStatic, isTauri } = usePlatform();
	const templates = PageDataContextService.value.wordTemplates;

	const { dismiss, show } = useDismissableToast({
		title: t(exportFormat === ExportFormat.pdf ? "export.pdf.process" : "export.docx.process"),
		closeAction: false,
		focus: "medium",
		size: "sm",
		status: "info",
		primaryAction: <Loader size="md" />,
	});

	const cancelableFunction = useMemo(
		() =>
			new CancelableFunction(async (signal) => {
				const res =
					exportFormat === ExportFormat.pdf
						? await FetchService.fetch(apiUrlCreator.getPdfSaveUrl(isCategory, itemRefPath))
						: await FetchService.fetch(
								apiUrlCreator.getWordSaveUrl(isCategory, itemRefPath, selectedTemplate),
						  );
				if (!res.ok || signal.aborted) return;
				downloadFile(
					isNext || isStatic ? await res.buffer() : res.body,
					exportFormat === ExportFormat.docx ? MimeTypes.docx : MimeTypes.pdf,
					fileName,
				);
			}),
		[fileName, selectedTemplate],
	);

	const startDownload = () => {
		setIsDownloading(true);
		setIsOpen(false);
		show();
		cancelableFunction.start().finally(() => {
			setIsDownloading(false);
			dismiss?.current();
		});
	};

	const getErrorElementsUrl = (format: ExportFormat, isCategory: boolean, itemPath: string) => {
		return apiUrlCreator.getErrorWordElementsUrl(isCategory, itemPath, format);
	};

	const onOpen = async () => {
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
		startDownload();
	};

	const domain = PageDataContextService.value.domain;
	const unsupportedElementsModal = (
		<CommonUnsupportedElementsModal
			title={t("unsupported-elements-title")}
			description={
				exportFormat === ExportFormat.pdf
					? t("unsupported-elements-warning1-pdf")
					: t("unsupported-elements-warning1")
			}
			noteTitle={t("unsupported-elements-warning2")}
			firstColumnTitle={t("article2")}
			unsupportedNodes={errorWordElements}
			actionButtonText={t("continue")}
			iconColor="var(--color-admonition-note-br-h)"
			onActionClick={startDownload}
			onCancelClick={() => setIsOpen(false)}
			renderArticleLink={(article) =>
				!isTauri ? (
					<PureLink href={domain + "/" + article.link}>{article.title}</PureLink>
				) : (
					<p>{article.title}</p>
				)
			}
		/>
	);

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

	const ref = useRef();

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
								setSelectedTemplate(undefined);
								void onOpen();
							}}
						/>
						<TemplateHeader />
						{templates?.map((template) => (
							<ButtonLink
								key={template}
								iconCode="file-text"
								text={template.split(".")[0]}
								onClick={() => {
									setSelectedTemplate(template);
									void onOpen();
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

	return (
		<>
			{isOpen && errorWordElements.length > 0 && (
				<ModalLayout
					isOpen={isOpen}
					onClose={() => {
						setIsOpen(false);
						if (isDownloading) cancelableFunction.abort();
					}}
					trigger={<></>}
				>
					<ModalLayoutLight>{unsupportedElementsModal}</ModalLayoutLight>
				</ModalLayout>
			)}
			{renderExportButton}
		</>
	);
};

export default ItemExport;
