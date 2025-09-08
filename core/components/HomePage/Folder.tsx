import Url from "@core-ui/ApiServices/Types/Url";
import type { Section } from "@core/SitePresenter/SitePresenter";
import { FeatureIcon } from "@ui-kit/Icon";
import { ActionCard, CardFolder, CardSubTitle, CardTitle, CardFeature } from "ics-ui-kit/components/card";
import Link from "../Atoms/Link";

const Folder = ({ section }: { section: Section }) => {
	return (
		<CardFolder className="h-[116px] w-[268px]">
			<Link href={Url.from({ pathname: section.href })}>
				<ActionCard className="h-[116px] w-[268px] dark:bg-secondary-bg dark:hover:bg-secondary-bg-hover">
					<CardTitle>{section.title}</CardTitle>
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
