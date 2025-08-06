import Card from "@components/HomePage/Card";
import t, { TranslationKey } from "@ext/localization/locale/translate";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { type Dispatch, type SetStateAction } from "react";

interface GroupProps {
	catalogLinks: CatalogLink[];
	setIsAnyCardLoading: Dispatch<SetStateAction<boolean>>;
	title?: TranslationKey;
	className?: string;
}

const Group = ({ title, catalogLinks, setIsAnyCardLoading }: GroupProps) => {
	return (
		<div className="flex flex-col gap-6 pt-4">
			{title && <h3 className="text-center text-2xl font-semibold text-primary-fg">{t(title)}</h3>}
			<div className="group-container">
				{catalogLinks.map((link) => (
					<Card key={link.name} name={link.name} link={link} onClick={() => setIsAnyCardLoading(true)} />
				))}
			</div>
		</div>
	);
};

export default Group;
