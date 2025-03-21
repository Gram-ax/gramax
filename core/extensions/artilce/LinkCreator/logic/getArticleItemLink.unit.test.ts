import { ItemType } from "@core/FileStructue/Item/ItemType";
import getArticleItemLink from "@ext/artilce/LinkCreator/logic/getArticleItemLink";
import { CategoryLink } from "@ext/navigation/NavigationLinks";

describe("getArticleItemLink", () => {
	const itemLinks: CategoryLink[] = [
		{
			ref: { path: "/test", storageId: "1" },
			type: ItemType.category,
			title: "test",
			icon: "test",
			isCurrentLink: false,
			pathname: "test",
			isExpanded: false,
			items: [],
		},
		{
			ref: { path: "/category", storageId: "2" },
			type: ItemType.category,
			title: "Subcategory",
			icon: "folder",
			isCurrentLink: false,
			isExpanded: false,
			pathname: "subcategory",
			items: [
				{
					ref: { path: "/category/nested", storageId: "2.1" },
					type: ItemType.article,
					title: "Nested Article",
					icon: "file",
					isCurrentLink: false,
					pathname: "nested",
				},
				{
					ref: { path: "/category/deep", storageId: "2.2" },
					type: ItemType.category,
					title: "Deep Article",
					icon: "file",
					isCurrentLink: false,
					pathname: "deep",
					items: [
						{
							ref: { path: "/category/deep/very-deep", storageId: "2.2.1" },
							type: ItemType.article,
							title: "Very Deep Article",
							icon: "file",
							isCurrentLink: false,
							pathname: "very-deep",
						},
					],
				},
			],
		},
		{
			ref: { path: "/docs/intro", storageId: "3" },
			type: ItemType.category,
			title: "Introduction",
			icon: "file",
			isCurrentLink: false,
			pathname: "intro",
			isExpanded: false,
			items: [],
		},
		{
			ref: { path: "/projects/current", storageId: "4" },
			type: ItemType.category,
			title: "Current Projects",
			icon: "project",
			isCurrentLink: false,
			pathname: "current",
			isExpanded: false,
			items: [
				{
					ref: { path: "/projects/current/active", storageId: "4.1" },
					type: ItemType.article,
					title: "Active Projects",
					icon: "project",
					isCurrentLink: false,
					pathname: "active",
				},
			],
		},
		{
			ref: { path: "/archive/2023", storageId: "5" },
			type: ItemType.category,
			title: "2023 Archive",
			icon: "archive",
			isCurrentLink: false,
			pathname: "2023",
			isExpanded: false,
			items: [],
		},
		{
			ref: { path: "/settings/account", storageId: "6" },
			type: ItemType.category,
			title: "Account Settings",
			icon: "settings",
			isCurrentLink: false,
			pathname: "account",
			isExpanded: false,
			items: [],
		},
		{
			ref: { path: "/help/faq", storageId: "7" },
			type: ItemType.category,
			title: "FAQ",
			icon: "help",
			isCurrentLink: false,
			pathname: "faq",
			isExpanded: false,
			items: [
				{
					ref: { path: "/help/faq/general", storageId: "7.1" },
					type: ItemType.article,
					title: "General Questions",
					icon: "help",
					isCurrentLink: false,
					pathname: "general",
				},
				{
					ref: { path: "/help/faq/technical", storageId: "7.2" },
					type: ItemType.article,
					title: "Technical Support",
					icon: "help",
					isCurrentLink: false,
					pathname: "technical",
				},
			],
		},
	];

	test("on first level", () => {
		const findPath = "/test";
		const result = getArticleItemLink(itemLinks, findPath);
		expect(result).toEqual({
			ref: { path: "/test", storageId: "1" },
			type: ItemType.category,
			title: "test",
			icon: "test",
			isCurrentLink: false,
			pathname: "test",
			isExpanded: false,
			items: [],
		});
	});

	test("on deepest level", () => {
		const findPath = "/category/deep/very-deep";
		const result = getArticleItemLink(itemLinks, findPath);
		expect(result).toEqual({
			ref: { path: "/category/deep/very-deep", storageId: "2.2.1" },
			type: ItemType.article,
			title: "Very Deep Article",
			icon: "file",
			isCurrentLink: false,
			pathname: "very-deep",
		});
	});
});
