import type { Section } from "@core/SitePresenter/SitePresenter";
import Url from "@core-ui/ApiServices/Types/Url";
import t from "@ext/localization/locale/translate";
import { ActionCard, CardFeature, CardFolder, CardSubTitle, CardTitle } from "@ui-kit/Card";
import { FeatureIcon } from "@ui-kit/Icon";
import Link from "../Atoms/Link";

const Folder = ({ section, sectionKey }: { section: Section; sectionKey: string }) => {
	const title = section.title || t("new-group");
	return (
		<CardFolder className="h-[110px]" data-folder={sectionKey}>
			<Link className="w-full" href={Url.from({ pathname: section.href })}>
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
