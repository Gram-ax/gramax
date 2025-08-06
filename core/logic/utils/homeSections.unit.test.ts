import { HomePageBreadcrumb, Section } from "@core/SitePresenter/SitePresenter";
import homeSections from "./homeSections";

// Мокаем функцию перевода
jest.mock("@ext/localization/locale/translate", () => {
	return jest.fn((key: string) => (key === "home" ? "Главная" : key));
});

describe("homeSections", () => {
	describe("isHomeSectionPath", () => {
		test("should return true for paths starting with /home", () => {
			expect(homeSections.isHomeSectionPath("/home")).toBe(true);
			expect(homeSections.isHomeSectionPath("/home/section1")).toBe(true);
			expect(homeSections.isHomeSectionPath("/home/section1/section2")).toBe(true);
		});

		test("should return false for paths not starting with /home", () => {
			expect(homeSections.isHomeSectionPath("/")).toBe(false);
			expect(homeSections.isHomeSectionPath("/section1")).toBe(false);
			expect(homeSections.isHomeSectionPath("/dashboard")).toBe(false);
			expect(homeSections.isHomeSectionPath("")).toBe(false);
		});
	});

	describe("getHomePathSections", () => {
		test("should return sections for valid /home path", () => {
			expect(homeSections.getHomePathSections("/home")).toEqual([]);
		});

		test("should return sections for path with single section", () => {
			expect(homeSections.getHomePathSections("/home/section1")).toEqual(["section1"]);
		});

		test("should return sections for path with multiple sections", () => {
			expect(homeSections.getHomePathSections("/home/section1/section2")).toEqual(["section1", "section2"]);
		});

		test("should return empty array for paths not starting with /home", () => {
			expect(homeSections.getHomePathSections("/")).toEqual([]);
			expect(homeSections.getHomePathSections("/section1")).toEqual([]);
			expect(homeSections.getHomePathSections("")).toEqual([]);
		});
	});

	describe("getSectionHref", () => {
		test("should create href for empty sections array", () => {
			expect(homeSections.getSectionHref([])).toBe("/home/");
		});

		test("should create href for single section", () => {
			expect(homeSections.getSectionHref(["section1"])).toBe("/home/section1");
		});

		test("should create href for multiple sections", () => {
			expect(homeSections.getSectionHref(["section1", "section2", "section3"])).toBe(
				"/home/section1/section2/section3",
			);
		});
	});

	describe("findSection", () => {
		const mockSection: Section = {
			title: "Главная",
			href: "/",
			catalogLinks: [],
			sections: {
				section1: {
					title: "Секция 1",
					href: "/home/section1",
					catalogLinks: [],
					sections: {
						subsection1: {
							title: "Подсекция 1",
							href: "/home/section1/subsection1",
							catalogLinks: [],
							sections: {},
						},
					},
				},
				section2: {
					title: "Секция 2",
					href: "/home/section2",
					catalogLinks: [],
					sections: {},
				},
			},
		};

		test("should return original section and breadcrumb for empty path", () => {
			const result = homeSections.findSection([], mockSection);

			expect(result.section).toBe(mockSection);
			expect(result.breadcrumb).toEqual([]);
		});

		test("should find first level section", () => {
			const result = homeSections.findSection(["section1"], mockSection);

			expect(result.section).toBe(mockSection.sections!.section1);
			expect(result.breadcrumb).toEqual([
				{ title: "Главная", href: "/" },
				{ title: "Секция 1", href: "/home/section1" },
			]);
		});

		test("should find nested section", () => {
			const result = homeSections.findSection(["section1", "subsection1"], mockSection);

			expect(result.section).toBe(mockSection.sections!.section1.sections!.subsection1);
			expect(result.breadcrumb).toEqual([
				{ title: "Главная", href: "/" },
				{ title: "Секция 1", href: "/home/section1" },
				{ title: "Подсекция 1", href: "/home/section1/subsection1" },
			]);
		});

		test("should return original section if section not found", () => {
			const result = homeSections.findSection(["nonexistent"], mockSection);

			expect(result.section).toBe(mockSection);
			expect(result.breadcrumb).toEqual([]);
		});

		test("should return original section if path partially not found", () => {
			const result = homeSections.findSection(["section1", "nonexistent"], mockSection);

			expect(result.section).toBe(mockSection.sections!.section1);
			expect(result.breadcrumb).toEqual([
				{ title: "Главная", href: "/" },
				{ title: "Секция 1", href: "/home/section1" },
			]);
		});

		test("should use provided breadcrumb", () => {
			const existingBreadcrumb: HomePageBreadcrumb[] = [{ title: "Предыдущая", href: "/previous" }];

			const result = homeSections.findSection(["section1"], mockSection, existingBreadcrumb);

			expect(result.section).toBe(mockSection.sections!.section1);
			expect(result.breadcrumb).toEqual([
				{ title: "Предыдущая", href: "/previous" },
				{ title: "Секция 1", href: "/home/section1" },
			]);
		});

		test("should work with section without nested sections", () => {
			const simpleSection: Section = {
				title: "Простая секция",
				href: "/simple",
				catalogLinks: [],
				sections: {},
			};

			const result = homeSections.findSection(["any"], simpleSection);

			expect(result.section).toBe(simpleSection);
			expect(result.breadcrumb).toEqual([]);
		});
	});
});
