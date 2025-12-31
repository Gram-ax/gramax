import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { ReactNode } from "react";

const CatalogExport = ({ disabled, children }: { disabled: boolean; children?: () => ReactNode }) => {
	return (
		<CatalogItem
			renderLabel={(Item) => {
				return (
					<Item disabled={disabled}>
						<Tooltip>
							<TooltipContent>{t("export-disabled")}</TooltipContent>
							<TooltipTrigger asChild>
								<>
									<Icon code="file-output" />
									{t("export.name")}
								</>
							</TooltipTrigger>
						</Tooltip>
					</Item>
				);
			}}
		>
			{children}
		</CatalogItem>
	);
};

export default CatalogExport;
