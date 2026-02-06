import type { CatalogMoveConflictResolution } from "@app/commands/catalog/move";
import t from "@ext/localization/locale/translate";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { Button } from "@ui-kit/Button";

interface DuplicateCatalogDialogProps {
	catalogName: string;
	targetWorkspaceName: string;
	onResolve: (resolution: CatalogMoveConflictResolution) => void;
}

const DuplicateCatalogDialog = ({ catalogName, targetWorkspaceName, onResolve }: DuplicateCatalogDialogProps) => {
	const handleResolve = (resolution: CatalogMoveConflictResolution) => {
		onResolve(resolution);
	};

	return (
		<AlertDialog open>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("catalog.duplicate.title")}</AlertDialogTitle>
					<AlertDialogDescription
						dangerouslySetInnerHTML={{
							__html: t("catalog.duplicate.description")
								.replace("{{catalogName}}", catalogName)
								.replace("{{targetWorkspaceName}}", targetWorkspaceName),
						}}
					></AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => handleResolve(null)}>
						{t("catalog.duplicate.cancel")}
					</AlertDialogCancel>
					<Button onClick={() => handleResolve("keepBoth")} variant="outline">
						{t("catalog.duplicate.keep-both")}
					</Button>
					<Button onClick={() => handleResolve("replace")} status="error" variant="primary">
						{t("catalog.duplicate.replace")}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DuplicateCatalogDialog;
