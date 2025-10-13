import DownloadZip from "@components/Actions/DownloadZip";
import Icon from "@components/Atoms/Icon";
import ItemExport, { ExportFormat } from "@ext/wordExport/components/ItemExport";
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

const CatalogExport = ({ name, disabled }: { name: string; disabled: boolean }) => {
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger disabled={disabled}>
				<Tooltip>
					<TooltipContent>{t("export-disabled")}</TooltipContent>
					<TooltipTrigger asChild>
						<>
							<Icon code="file-output" />
							{t("export.name")}
						</>
					</TooltipTrigger>
				</Tooltip>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<ItemExport fileName={name} exportFormat={ExportFormat.docx} />
				<ItemExport fileName={name} exportFormat={ExportFormat.pdf} />
				<DownloadZip />
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default CatalogExport;
