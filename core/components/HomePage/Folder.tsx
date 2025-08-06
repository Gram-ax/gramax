import Url from "@core-ui/ApiServices/Types/Url";
import type { Section } from "@core/SitePresenter/SitePresenter";
import { FeatureIcon } from "@ui-kit/Icon";
import { ActionCard, CardFolder, CardSubTitle, CardTitle } from "ics-ui-kit/components/card";
import Link from "../Atoms/Link";

const Folder = ({ section }: { section: Section }) => {
	return (
		<Link href={Url.from({ pathname: section.href })}>
			<CardFolder className="h-[116px] w-[268px] dark:bg-secondary-bg dark:hover:bg-secondary-bg-hover hover:cursor-pointer">
				<ActionCard className="h-[116px] w-[268px] dark:bg-secondary-bg dark:hover:bg-secondary-bg-hover">
					<CardTitle>{section.title}</CardTitle>
					{section.description && <CardSubTitle>{section.description}</CardSubTitle>}

					{/* <CardFeatureIcon> */}
					{section.icon && (
						<div className="absolute bottom-2.5 right-3 lg:bottom-3 lg:right-4">
							<FeatureIcon icon={section.icon} size="lg" type="primary" />
						</div>
					)}
					{/* </CardFeatureIcon> */}
				</ActionCard>
			</CardFolder>
		</Link>
	);
};

export default Folder;
