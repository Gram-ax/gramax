import type ExportPdf from "@components/Actions/Modal/ExportPdf";
import { useDismissableToast } from "@components/Atoms/DismissableToast";
import Icon from "@components/Atoms/Icon";
import PureLink from "@components/Atoms/PureLink";
import { CancelableFunction } from "@core/utils/CancelableFunction";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { downloadFile } from "@core-ui/downloadResource";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type CommonUnsupportedElementsModal from "@ext/import/components/CommonUnsupportedElementsModal";
import type { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import {
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import { Loader } from "@ui-kit/Loader";
import { type ComponentProps, useCallback, useMemo, useRef } from "react";

interface ItemExportProps {
	fileName: string;
	itemRefPath?: string;
	isCategory?: boolean;
	isLoading?: boolean;
}

interface ExportProps extends ItemExportProps {
	exportFormat: ExportFormat;
}

export enum ExportFormat {
	pdf = "pdf",
	docx = "docx",
	"beta-pdf" = "beta-pdf",
	"legacy-pdf" = "legacy-pdf",
}

const WordExport = ({ fileName, itemRefPath, isCategory, isLoading }: ItemExportProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext, isStatic, isTauri } = usePlatform();

	const templates = PageDataContextService.value.wordTemplates;

	const domain = PageDataContextService.value.domain;

	const { dismiss, show } = useDismissableToast({
		title: t("export.docx.process"),
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
				const res = await FetchService.fetch(apiUrlCreator.getWordSaveUrl(isCategory, itemRefPath, template));
				if (!res.ok || signal.aborted) return;
				downloadFile(isNext || isStatic ? await res.buffer() : res.body, MimeTypes.docx, fileName);
			}),
		[fileName, apiUrlCreator, isCategory, itemRefPath, isNext, isStatic],
	);

	const startDownload = useCallback(
		(template?: string) => {
			show();

			const cf = cancelableFunction(template);
			currentCancelableRef.current = cf;
			cf.start().finally(() => {
				ModalToOpenService.resetValue();
				dismiss?.current();
			});
		},
		[cancelableFunction, dismiss, show],
	);

	const renderArticleLink = useCallback(
		(props: { title: string; link: string }): JSX.Element => {
			const { title, link } = props;
			return !isTauri ? (
				<PureLink href={`${domain}/${link}`}>
					<Button
						className="p-0"
						status="default"
						style={{ height: "auto", textAlign: "left" }}
						variant="link"
					>
						{title}
					</Button>
				</PureLink>
			) : (
				<p style={{ margin: "0" }}>{title}</p>
			);
		},
		[domain, isTauri],
	);

	const onOpen = useCallback(
		async (template?: string) => {
			const url = apiUrlCreator.getErrorWordElementsUrl(isCategory, itemRefPath);
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
						description: `${t("unsupported-elements-warning1")} ${t("unsupported-elements-warning3")}`,
						firstColumnTitle: t("article2"),
					},
				);
			}

			startDownload(template);
		},
		[apiUrlCreator, isCategory, itemRefPath, renderArticleLink, isLoading, startDownload],
	);

	const exportText: string = useMemo(() => {
		if (itemRefPath) {
			return isCategory ? t("export.docx.category") : t("export.docx.article");
		}
		return t("export.docx.catalog");
	}, [itemRefPath, isCategory]);

	const renderExportButton = useMemo(() => {
		if (templates.length > 0) {
			return (
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<Icon code="file-text" />
						{exportText}
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
				{exportText}
			</DropdownMenuItem>
		);
	}, [exportText, templates, onOpen]);

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

export default (props: ExportProps) => {
	if (props.exportFormat === ExportFormat.pdf) {
		return <PdfExportButton isCategory={props.isCategory} itemRefPath={props.itemRefPath} />;
	}
	return <WordExport {...props} />;
};
