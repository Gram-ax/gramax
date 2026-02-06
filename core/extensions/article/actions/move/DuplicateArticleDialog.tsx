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

interface DuplicateArticleDialogProps {
	articleName: string;
	targetCatalogName: string;
	targetWorkspaceName: string;
	onResolve: (resolution: CatalogMoveConflictResolution) => void;
}

const DuplicateArticleDialog = ({ articleName, targetCatalogName, onResolve }: DuplicateArticleDialogProps) => {
	const handleResolve = (resolution: CatalogMoveConflictResolution) => {
		onResolve(resolution);
	};

	return (
		<AlertDialog open>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("article.move.duplicate.title")}</AlertDialogTitle>
					<AlertDialogDescription
						dangerouslySetInnerHTML={{
							__html: t("article.move.duplicate.description")
								.replace("{{articleName}}", articleName)
								.replace("{{targetCatalogName}}", targetCatalogName),
						}}
					></AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => handleResolve(null)}>
						{t("article.move.duplicate.cancel")}
					</AlertDialogCancel>
					<Button onClick={() => handleResolve("keepBoth")} variant="outline">
						{t("article.move.duplicate.keep-both")}
					</Button>
					<Button onClick={() => handleResolve("replace")} status="error" variant="primary">
						{t("article.move.duplicate.replace")}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DuplicateArticleDialog;
