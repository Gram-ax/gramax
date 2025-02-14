import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { useRouter } from "@core/Api/useRouter";
import ThemeService from "@ext/Theme/components/ThemeService";
import t from "@ext/localization/locale/translate";
import { useRef } from "react";
import ItemExport, { ExportFormat } from "../../extensions/wordExport/components/ItemExport";
import ExportButton from "@ext/wordExport/components/ExportButton";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { openPrintView } from "@ext/artilce/actions/SaveAsPdf/OpenPrintView";
import ButtonLink from "@components/Molecules/ButtonLink";

interface ExportToDocxOrPdfProps {
	fileName: string;
	pathname: string;
	itemRefPath: string;
	isCategory: boolean;
}

const ExportToDocxOrPdf = (props: ExportToDocxOrPdfProps) => {
	const { fileName, itemRefPath, isCategory } = props;
	const ref = useRef();
	const theme = ThemeService.value;

	const SaveAsPdfHandler = () => {
		setTimeout(() => {
			openPrintView(theme);
		}, 1500);
	};

	return (
		<PopupMenuLayout
			appendTo={() => ref.current}
			offset={[10, -5]}
			className="wrapper"
			placement="right-start"
			openTrigger="mouseenter focus"
			trigger={<ExportButton ref={ref} iconCode="file-output" text={t("export")} />}
		>
			{isCategory && (
				<ItemExport
					fileName={fileName}
					itemRefPath={itemRefPath}
					isCategory={isCategory}
					exportFormat={ExportFormat.docx}
				/>
			)}
			<ItemExport
				fileName={fileName}
				itemRefPath={itemRefPath}
				isCategory={false}
				exportFormat={ExportFormat.docx}
			/>

			{getExecutingEnvironment() === "next" && (
				<ButtonLink
					className="test"
					onClick={SaveAsPdfHandler}
					iconCode="file-text"
					text={t("article-to-pdf")}
				/>
			)}

			{getExecutingEnvironment() !== "next" && isCategory && (
				<ItemExport
					fileName={fileName}
					itemRefPath={itemRefPath}
					isCategory={isCategory}
					exportFormat={ExportFormat.pdf}
				/>
			)}

			{getExecutingEnvironment() !== "next" && (
				<ItemExport
					fileName={fileName}
					itemRefPath={itemRefPath}
					isCategory={false}
					exportFormat={ExportFormat.pdf}
				/>
			)}
		</PopupMenuLayout>
	);
};

export default ExportToDocxOrPdf;
