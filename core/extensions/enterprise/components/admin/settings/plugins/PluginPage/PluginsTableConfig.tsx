import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import type { ColumnDef } from "@ui-kit/DataTable";
import { Switch } from "@ui-kit/Switch";

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

export const getPluginsTableColumns = ({
	onDelete,
	onToggleState,
}: GetPluginsTableColumnsProps): ColumnDef<PluginTableRow>[] => [
	{
		id: "name",
		accessorKey: "name",
		header: t("name"),
	},
	{
		id: "version",
		accessorKey: "version",
		header: t("version"),
		size: 96,
	},
	{
		id: "actions",
		header: t("actions"),
		size: 96,
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
						<IconButton
							className="hover:text-[color:var(--color-danger)]"
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
