import Url from "@core-ui/ApiServices/Types/Url";
import type { Section } from "@core/SitePresenter/SitePresenter";
import { FeatureIcon } from "@ui-kit/Icon";
import { ActionCard, CardFolder, CardSubTitle, CardTitle, CardFeature } from "@ui-kit/Card";
import Link from "../Atoms/Link";
import t from "@ext/localization/locale/translate";

const Folder = ({ section, sectionKey }: { section: Section; sectionKey: string }) => {
	const title = section.title || t("new-group");
	return (
		<CardFolder className="h-[110px]" data-folder={sectionKey}>
			<Link href={Url.from({ pathname: section.href })} className="w-full">
				<ActionCard className="h-[110px] dark:bg-secondary-bg dark:hover:bg-secondary-bg-hover">
					<CardTitle>{title}</CardTitle>
					{section.description && <CardSubTitle>{section.description}</CardSubTitle>}

					{section.icon && (
						<CardFeature>
							<FeatureIcon icon={section.icon} size="lg" type="primary" />
						</CardFeature>
					)}
				</ActionCard>
			</Link>
		</CardFolder>
	);
};

export default Folder;
