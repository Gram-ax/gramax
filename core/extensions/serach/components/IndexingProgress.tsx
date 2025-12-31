import LucideIconComponent from "@components/Atoms/Icon/LucideIcon";
import t from "@ext/localization/locale/translate";
import { ProgressBlockTemplate } from "@ui-kit/Progress";
import { LucideIcon } from "lucide-react";

interface IndexingProgressProps {
	progress: number;
}

export const IndexingProgress = ({ progress }: IndexingProgressProps) => {
	return (
		<>
			<div className="search-form-divider"></div>
			<div className="search-form-indexing-progress">
				<ProgressBlockTemplate
					max={1}
					value={progress}
					description={`${(progress * 100).toFixed(0)}%`}
					title={t("search.indexing-info")}
					icon={LucideIconComponent("loader") as LucideIcon}
					size="sm"
				/>
			</div>
		</>
	);
};
