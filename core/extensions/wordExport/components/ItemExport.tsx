import ExportPdf from "@components/Actions/Modal/ExportPdf";
import { useDismissableToast } from "@components/Atoms/DismissableToast";
import Icon from "@components/Atoms/Icon";
import PureLink from "@components/Atoms/PureLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { downloadFile } from "@core-ui/downloadResource";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { CancelableFunction } from "@core/utils/CancelableFunction";
import CommonUnsupportedElementsModal from "@ext/import/components/CommonUnsupportedElementsModal";
import { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import { feature } from "@ext/toggleFeatures/features";
import { Button } from "@ui-kit/Button";
import {
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import { ComponentProps, useMemo, useRef } from "react";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { Loader } from "@ui-kit/Loader";

interface ItemExportProps {
	fileName: string;
	exportFormat: ExportFormat;
	itemRefPath?: string;
	isCategory?: boolean;
	isLoading?: boolean;
}

export enum ExportFormat {
	pdf = "pdf",
	docx = "docx",
	"beta-pdf" = "beta-pdf",
}

const ItemExport = ({ fileName, itemRefPath, isCategory, exportFormat, isLoading }: ItemExportProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext, isStatic, isTauri } = usePlatform();

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
		show();

		const cf = cancelableFunction(template);
		currentCancelableRef.current = cf;
		cf.start().finally(() => {
			ModalToOpenService.resetValue();
			dismiss?.current();
		});
	};

	const getErrorElementsUrl = (format: ExportFormat, isCategory: boolean, itemPath: string) => {
		return apiUrlCreator.getErrorWordElementsUrl(isCategory, itemPath, format);
	};

	const renderArticleLink = ({ title, link }: { title: string; link: string }) => {
		return !isTauri ? (
			<PureLink href={domain + "/" + link}>
				<Button variant="link" status="default" className="p-0" style={{ height: "auto", textAlign: "left" }}>
					{title}
				</Button>
			</PureLink>
		) : (
			<p style={{ margin: "0" }}>{title}</p>
		);
	};

	const onOpen = async (template?: string) => {
		const url = getErrorElementsUrl(exportFormat, isCategory, itemRefPath);
		const res = await FetchService.fetch<UnsupportedElements[]>(url);
		const errorWordElements = await res.json();

		if (errorWordElements.length > 0) {
			return ModalToOpenService.setValue<ComponentProps<typeof CommonUnsupportedElementsModal>>(
				ModalToOpen.UnsupportedElements,
				{
					open: true,
					onOpenChange: (open) => !open && ModalToOpenService.resetValue(),
					renderArticleLink,
					isLoading: isLoading,
					unsupportedElements: errorWordElements,
					onContinue: () => startDownload(template),
					title: t("unsupported-elements-title"),
					description: `${
						exportFormat === ExportFormat.pdf
							? t("unsupported-elements-warning1-pdf")
							: t("unsupported-elements-warning1")
					} ${t("unsupported-elements-warning3")}`,
					firstColumnTitle: t("article2"),
				},
			);
		}

		startDownload(template);
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
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<Icon code="file-text" />
						{getExportText()}
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuLabel>{t("word.template.templates")}</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{templates?.map((template) => (
							<DropdownMenuItem key={template} onSelect={() => void onOpen(template)}>
								<Icon code="file-text" />
								{template.split(".")[0]}
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={() => onOpen()}>
							<Icon code="file-text" />
							{t("word.template.no-template")}
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			);
		}

		return (
			<DropdownMenuItem onSelect={() => void onOpen()}>
				<Icon code="file-text" />
				{getExportText()}
			</DropdownMenuItem>
		);
	}, [exportFormat, getExportText, templates]);

	return renderExportButton;
};

const PdfExportButton = ({ itemRefPath, isCategory }: { itemRefPath?: string; isCategory?: boolean }) => {
	const catalogProps = useCatalogPropsStore((state) => state.data);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pdfTemplates = PageDataContextService.value.pdfTemplates;

	const onClick = () => {
		ModalToOpenService.setValue<ComponentProps<typeof ExportPdf>>(ModalToOpen.ExportPdf, {
			onClose: () => ModalToOpenService.resetValue(),
			catalogProps,
			itemRefPath,
			isCategory,
			apiUrlCreator,
			templates: pdfTemplates,
		});
	};

	return (
		<DropdownMenuItem onSelect={onClick}>
			<Icon code="file-text" />
			{itemRefPath ? (isCategory ? t("export.pdf.category") : t("export.pdf.article")) : t("export.pdf.catalog")}
		</DropdownMenuItem>
	);
};

export default (props: ItemExportProps) => {
	if (props.exportFormat === ExportFormat.pdf && feature("export-pdf")) {
		return <PdfExportButton itemRefPath={props.itemRefPath} isCategory={props.isCategory} />;
	}
	return <ItemExport {...props} />;
};
