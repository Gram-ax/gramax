import { HomePageBreadcrumb, Section, Sections } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import { CatalogLink } from "@ext/navigation/NavigationLinks";

const HOME_SECTION_PREFIX = "/home";

const homeSections = {
	isHomeSectionPath: (path: string) => path?.startsWith?.(HOME_SECTION_PREFIX),

	getHomePathSections: (path: string) => {
		return homeSections.isHomeSectionPath(path) ? path.split("/").slice(2) : [];
	},

	getSectionHref: (sectionKeys: string[]) => {
		return `${HOME_SECTION_PREFIX}/${sectionKeys.join("/")}`;
	},

	getMainSection: (otherCatalogLinks: CatalogLink[], sections: Sections): Section => {
		return {
			href: "/",
			title: t("home"),
			catalogLinks: otherCatalogLinks,
			sections: sections,
		};
	},

	findSection: (
		pathSections: string[],
		section: Section,
		breadcrumb: HomePageBreadcrumb[] = [],
	): { section: Section; breadcrumb: HomePageBreadcrumb[] } => {
		if (pathSections.length === 0) return { section, breadcrumb };

		const s = section.sections[pathSections[0]];
		if (!s) return { section, breadcrumb };
		if (breadcrumb.length === 0) breadcrumb.push({ title: section.title, href: section.href });

		breadcrumb.push({ title: s.title, href: s.href });
		return homeSections.findSection(pathSections.slice(1), s, breadcrumb);
	},
};

export default homeSections;
