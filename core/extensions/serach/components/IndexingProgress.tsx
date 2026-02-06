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
					description={`${(progress * 100).toFixed(0)}%`}
					icon={LucideIconComponent("loader") as LucideIcon}
					max={1}
					size="sm"
					title={t("search.indexing-info")}
					value={progress}
				/>
			</div>
		</>
	);
};
