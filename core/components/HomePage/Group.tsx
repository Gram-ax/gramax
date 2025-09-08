import Card from "@components/HomePage/Card";
import Folder from "@components/HomePage/Folder";
import { Sections } from "@core/SitePresenter/SitePresenter";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { type Dispatch, type SetStateAction } from "react";

interface GroupProps {
	catalogLinks: CatalogLink[];
	setIsAnyCardLoading: Dispatch<SetStateAction<boolean>>;
	title?: string;
	className?: string;
	sections?: Sections;
}

const Group = ({ title, catalogLinks, setIsAnyCardLoading, sections }: GroupProps) => {
	const sectionKeys = Object.keys(sections || {});
	return (
		<div className="flex flex-col gap-6 pt-4">
			{title && <h3 className="text-center text-2xl font-semibold text-primary-fg">{title}</h3>}
			<div className="group-container">
				{sectionKeys.length !== 0 && (
					<div className="group-content">
						{sectionKeys.map((sectionKey, index) => {
							return <Folder key={sectionKey + index} section={sections[sectionKey]} />;
						})}
					</div>
				)}
				<div className="group-content">
					{catalogLinks.map((link) => (
						<Card key={link.name} name={link.name} link={link} onClick={() => setIsAnyCardLoading(true)} />
					))}
				</div>
			</div>
		</div>
	);
};

export default Group;
