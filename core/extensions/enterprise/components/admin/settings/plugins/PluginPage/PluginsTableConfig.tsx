import styled from "@emotion/styled";
import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t, { tString } from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef, useTableSelection } from "@ui-kit/DataTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";
import { Switch } from "ics-ui-kit/components/switch";

const DeleteButton = styled(IconButton)`
	&:hover {
		color: var(--color-danger);
	}
`;

export interface PluginTableRow {
	id: string;
	name: string;
	version: string;
	disabled: boolean;
	deleted: boolean;
	isBuiltIn: boolean;
	navigateToPage?: string;
}

interface GetPluginsTableColumnsProps {
	onDelete: (pluginId: string, pluginName: string) => void;
	onToggleState: (pluginId: string, isDisabled: boolean) => void;
}

export const columnClassName = {
	select: "w-10",
	name: "",
	version: "w-24",
	actions: "w-24 text-right",
};

export const getPluginsTableColumns = ({
	onDelete,
	onToggleState,
}: GetPluginsTableColumnsProps): ColumnDef<PluginTableRow>[] => [
	{
		id: TABLE_SELECT_COLUMN_CODE,
		header: ({ table }) => {
			const { allSelectableSelected, someSelectableSelected, handleSelectAll } = useTableSelection({
				table,
			});

			return (
				<Checkbox
					aria-label="Select all"
					checked={(allSelectableSelected || (someSelectableSelected && "indeterminate")) as CheckedState}
					onCheckedChange={handleSelectAll}
				/>
			);
		},
		cell: ({ row }) => {
			if (row.original.isBuiltIn) {
				return (
					<div onClick={(e) => e.stopPropagation()}>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="inline-flex ">
										<Checkbox disabled={true} />
									</span>
								</TooltipTrigger>
								<TooltipContent>
									<p>{tString("plugins.messages.built-in-cannot-delete")}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				);
			}
			return (
				<div onClick={(e) => e.stopPropagation()}>
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
					/>
				</div>
			);
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: "name",
		accessorKey: "name",
		header: t("name"),
	},
	{
		id: "version",
		accessorKey: "version",
		header: t("version"),
	},
	{
		id: "actions",
		header: t("actions"),
		cell: ({ row }) => {
			const plugin = row.original;

			return (
				<div className="flex h-8 items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
					<Switch
						checked={!plugin.disabled && !plugin.deleted}
						disabled={plugin.deleted}
						onCheckedChange={() => onToggleState(plugin.id, plugin.disabled)}
						size="sm"
					/>
					{plugin.deleted ? (
						<IconButton
							icon="rotate-ccw"
							onClick={() => onDelete(plugin.id, plugin.name)}
							size="sm"
							variant="ghost"
						/>
					) : !plugin.isBuiltIn ? (
						<DeleteButton
							icon="trash"
							onClick={() => onDelete(plugin.id, plugin.name)}
							size="sm"
							variant="ghost"
						/>
					) : (
						<div className="h-8 w-8" />
					)}
				</div>
			);
		},
		enableSorting: false,
		enableHiding: false,
	},
];
