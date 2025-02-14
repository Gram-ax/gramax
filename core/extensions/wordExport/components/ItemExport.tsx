import { getExecutingEnvironment } from "@app/resolveModule/env";
import PureLink from "@components/Atoms/PureLink";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { downloadFile } from "@core-ui/downloadResource";
import { CancelableFunction } from "@core/utils/CancelableFunction";
import CommonUnsupportedElementsModal from "@ext/import/components/CommonUnsupportedElementsModal";
import UnsupportedElements from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import { useMemo, useState } from "react";

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

const ItemExport = ({ fileName, itemRefPath, isCategory, exportFormat }: ItemExportProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isDownloading, setIsDownloading] = useState(false);
	const [errorWordElements, setErrorWordElements] = useState<UnsupportedElements[]>([]);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const cancelableFunction = useMemo(
		() =>
			new CancelableFunction(async (signal) => {
				const res =
					exportFormat === ExportFormat.pdf
						? await FetchService.fetch(apiUrlCreator.getPdfSaveUrl(isCategory, itemRefPath))
						: await FetchService.fetch(apiUrlCreator.getWordSaveUrl(isCategory, itemRefPath));
				if (!res.ok || signal.aborted) return;
				downloadFile(
					getExecutingEnvironment() === "next" ? await res.buffer() : res.body,
					exportFormat === ExportFormat.docx ? MimeTypes.docx : MimeTypes.pdf,
					fileName,
				);
			}),
		[fileName],
	);

	const startDownload = () => {
		setIsOpen(true);
		setIsLoading(true);
		setIsDownloading(true);
		cancelableFunction.start().finally(() => {
			setIsOpen(false);
			setIsDownloading(false);
		});
	};

	const getErrorElementsUrl = (format: ExportFormat, isCategory: boolean, itemPath: string) => {
		return apiUrlCreator.getErrorWordElementsUrl(isCategory, itemPath, exportFormat);
	};

	const onOpen = async () => {
		setIsLoading(true);

		const url = getErrorElementsUrl(exportFormat, isCategory, itemRefPath);
		const res = await FetchService.fetch<UnsupportedElements[]>(url);

		if (!res.ok) {
			setIsOpen(false);
			return;
		}
		const errorWordElements = await res.json();
		setErrorWordElements(errorWordElements);
		if (errorWordElements.length > 0) {
			setIsLoading(false);
			return;
		}
		startDownload();
	};

	const loading = (
		<FormStyle>
			<>
				<legend>{t("loading2")}</legend>
				<SpinnerLoader height={100} width={100} fullScreen />
			</>
		</FormStyle>
	);

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
				getExecutingEnvironment() !== "tauri" ? (
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
					? t("category-to-pdf")
					: t("category-to-docx")
				: exportFormat === ExportFormat.pdf
				? t("article-to-pdf")
				: t("article-to-docx");
		}
		return t("export-catalog-docx");
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => {
				setIsOpen(true);
				void onOpen();
			}}
			onClose={() => {
				setIsOpen(false);
				if (isDownloading) cancelableFunction.abort();
			}}
			trigger={<ButtonLink iconCode="file-text" text={getExportText()} />}
		>
			<ModalLayoutLight>{!isLoading ? unsupportedElementsModal : loading}</ModalLayoutLight>
		</ModalLayout>
	);
};

export default ItemExport;
