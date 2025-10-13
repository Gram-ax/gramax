import {
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import ItemExport, { ExportFormat } from "../../extensions/wordExport/components/ItemExport";

interface ExportToDocxOrPdfProps {
	fileName: string;
	itemRefPath: string;
	isCategory: boolean;
}

const ExportToDocxOrPdf = (props: ExportToDocxOrPdfProps) => {
	const { fileName, itemRefPath, isCategory } = props;

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<Icon code="file-output" />
				{t("export.name")}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
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
				{isCategory && <DropdownMenuSeparator />}
				{isCategory && (
					<ItemExport
						fileName={fileName}
						itemRefPath={itemRefPath}
						isCategory={isCategory}
						exportFormat={ExportFormat.pdf}
					/>
				)}

				<ItemExport
					fileName={fileName}
					itemRefPath={itemRefPath}
					isCategory={false}
					exportFormat={ExportFormat.pdf}
				/>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default ExportToDocxOrPdf;
