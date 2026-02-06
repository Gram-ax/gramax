import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import t from "@ext/localization/locale/translate";
import { Badge } from "@ui-kit/Badge";
import { IconButton } from "@ui-kit/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { WorkspaceSection } from "../../../types/WorkspaceComponent";

const MAX_VISIBLE_CATALOGS = 6;

interface SortableSectionItemProps {
	sectionKey: string;
	section: WorkspaceSection;
	onEdit: (key: string) => void;
	onDelete: (key: string) => void;
}

export function SortableSectionItem({ sectionKey, section, onEdit, onDelete }: SortableSectionItemProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionKey });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1000 : "auto",
	};

	const handleEditClick = () => {
		onEdit(sectionKey);
	};

	const handleDeleteClick = () => {
		onDelete(sectionKey);
	};

	return (
		<div
			className={`relative border rounded-lg p-4 bg-primary/[0.03] hover:bg-primary/[0.03] transition-colors cursor-grab active:cursor-grabbing ${
				isDragging ? "opacity-50 shadow-soft-lg" : ""
			}`}
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
		>
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-2">
						{section.icon && (
							<div className="text-lg">
								<Icon className="text-primary" icon={section.icon} size="md" />
							</div>
						)}
						<h3 className="text-lg font-medium">{section.title}</h3>
						<Badge key={sectionKey}>{sectionKey}</Badge>
					</div>
					{section.description && <p className="text-sm text-muted-foreground mb-2">{section.description}</p>}
					{section.catalogs && section.catalogs.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{(() => {
								const visibleCatalogs = section.catalogs!.slice(0, MAX_VISIBLE_CATALOGS);
								const remainingCount = section.catalogs!.length - MAX_VISIBLE_CATALOGS;

								return (
									<>
										{visibleCatalogs.map((catalog) => (
											<Badge key={catalog}>{catalog}</Badge>
										))}
										{remainingCount > 0 && (
											<Badge key={`${sectionKey}-remaining`}>+{remainingCount}</Badge>
										)}
									</>
								);
							})()}
						</div>
					)}
				</div>
				<div className="flex items-center gap-1 ml-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<IconButton icon="more-vertical" variant="ghost" />
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56">
							<DropdownMenuItem onSelect={handleEditClick}>
								<Icon icon="pencil" />
								{t("edit2")}
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={handleDeleteClick} type="danger">
								<Icon icon="trash" />
								{t("delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}
