import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import ThemeService from "@ext/Theme/components/ThemeService";
import { openPrintView } from "@ext/artilce/actions/SaveAsPdf/OpenPrintView";
import t from "@ext/localization/locale/translate";
import { useRef } from "react";
import ItemExport from "../../extensions/wordExport/components/ItemExport";

interface ExportToDocxOrPdfProps {
	fileName: string;
	pathname: string;
	itemRefPath: string;
	isCategory: boolean;
}

const ExportToDocxOrPdf = (props: ExportToDocxOrPdfProps) => {
	const { fileName, pathname, itemRefPath, isCategory } = props;
	const ref = useRef();
	const router = useRouter();
	const { isNext } = usePlatform();
	const theme = ThemeService.value;

	const SaveAsPdfHandler = () => {
		router.pushPath(pathname);
		setTimeout(() => {
			openPrintView(theme);
		}, 1500);
	};

	return (
		<PopupMenuLayout
			appendTo={() => ref.current}
			offset={[10, 5]}
			className="wrapper"
			placement="right-start"
			openTrigger="mouseenter focus"
			trigger={
				<div className="export-button" ref={ref}>
					<ButtonLink iconCode="file-output" text={t("export")} />
				</div>
			}
		>
			{isCategory && <ItemExport fileName={fileName} itemRefPath={itemRefPath} isCategory={isCategory} />}
			{!isNext && <ItemExport fileName={fileName} itemRefPath={itemRefPath} isCategory={false} />}

			<ButtonLink className="test" onClick={SaveAsPdfHandler} iconCode="file-text" text={t("article-to-pdf")} />
		</PopupMenuLayout>
	);
};

export default ExportToDocxOrPdf;
