import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import UiLanguage, { ContentLanguage } from "@ext/localization/core/model/Language";
import PermissionType from "@ext/security/logic/Permission/model/PermissionType";

export default {
	data: {
		markdown: "",
		catalogLinks: {},
		articleContentEdit: '{"type":"doc","content":[{"type":"paragraph"}]}',
		articleContentRender: '{"$$mdtype":"Tag","name":"article","attributes":{},"children":[]}',
		articleProps: {
			logicPath: "doc-reader/test/Refs/path",
			pathname: "/gitlab.ics-it.ru/dr/doc-reader/master/-/test/Refs/path",
			fileName: "path",
			ref: {
				path: "doc-reader/docs/test/Refs/path/_index.md",
				storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
			},
			title: "",
			description: "",
			tocItems: [],
			errorCode: null,
		},
		catalogProps: {
			notFound: false,
			link: {
				name: "doc-reader",
				pathname: "doc-reader",
				logo: "logo.svg",
				title: "DocReader",
				query: {},
				size: 39,
				group: "products",
				code: "dr",
				style: "red",
				description: "Предназначен для ведения документации.",
				order: 999999,
				isCloning: false,
			},
			docroot: "",
			relatedLinks: null,
			language: null,
			contactEmail: null,
			name: "doc-reader",
			title: "DocReader",
			supportedLanguages: [ContentLanguage.ru],
			readOnly: false,
			repositoryName: "doc-reader",
			storageType: "GitHub",
			storageName: "testdomain",
			sourceName: "GitHub",
			userInfo: null,
		},
		itemLinks: [
			{
				ref: {
					path: "doc-reader/docs/test/.category.yaml",
					storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
				},
				icon: null,
				title: "category",
				type: "category",
				pathname: "doc-reader/test",
				query: {},
				isCurrentLink: false,
				isExpanded: true,
				items: [
					{
						ref: {
							path: "doc-reader/docs/test/Refs/path/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "_index",
						type: "category",
						pathname: "doc-reader/test/Refs/path",
						query: {},
						isCurrentLink: true,
						existContent: true,
						isExpanded: true,
						items: [
							{
								ref: {
									path: "doc-reader/docs/test/Refs/path/article.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "Refs article title",
								type: "article",
								pathname: "doc-reader/test/Refs/path/article",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
						],
						filter: null,
					},
					{
						ref: {
							path: "doc-reader/docs/test/catalogMarkdown/category/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "catalogMarkdown _index title",
						type: "category",
						pathname: "doc-reader/test/catalogMarkdown/category",
						query: {},
						isCurrentLink: false,
						isExpanded: false,
						items: [
							{
								ref: {
									path: "doc-reader/docs/test/catalogMarkdown/category/emptyArticle.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "catalogMarkdown emptyArticle title",
								type: "article",
								pathname: "doc-reader/test/catalogMarkdown/category/emptyArticle",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
						],
						existContent: false,
						filter: null,
					},
					{
						ref: {
							path: "doc-reader/docs/test/Rules/Navigation/testCatalog/normalArticle.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Normal article",
						type: "article",
						pathname: "doc-reader/test/Rules/Navigation/testCatalog/normalArticle",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/test/Rules/catalogTestCatalog/category/.category.yaml",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "category",
						type: "category",
						pathname: "doc-reader/test/Rules/catalogTestCatalog/category",
						query: {},
						isCurrentLink: false,
						isExpanded: false,
						items: [
							{
								ref: {
									path: "doc-reader/docs/test/Rules/catalogTestCatalog/category/test.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "test",
								type: "article",
								pathname: "doc-reader/test/Rules/catalogTestCatalog/category/test",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
						],
						existContent: false,
						filter: null,
					},
					{
						ref: {
							path: "doc-reader/docs/test/Rules/categoryTestCatalog/category/.category.yaml",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "category",
						type: "category",
						pathname: "doc-reader/test/Rules/categoryTestCatalog/category",
						query: {},
						isCurrentLink: false,
						isExpanded: false,
						items: [
							{
								ref: {
									path: "doc-reader/docs/test/Rules/categoryTestCatalog/category/test.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "test",
								type: "article",
								pathname: "doc-reader/test/Rules/categoryTestCatalog/category/test",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
						],
						existContent: false,
						filter: null,
					},
					{
						ref: {
							path: "doc-reader/docs/test/Rules/Navigation/indexArticleTestCatalog/category/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "_Index article title",
						type: "category",
						pathname: "doc-reader/test/Rules/Navigation/indexArticleTestCatalog/category",
						query: {},
						isCurrentLink: false,
						existContent: true,
						isExpanded: false,
						items: [],
						filter: null,
					},
				],
				existContent: false,
				filter: null,
			},
			{
				ref: {
					path: "doc-reader/docs/new/_index.md",
					storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
				},
				icon: null,
				title: "Что нового",
				type: "category",
				pathname: "doc-reader/new",
				query: {},
				isCurrentLink: false,
				existContent: true,
				isExpanded: true,
				items: [],
				filter: null,
			},
			{
				ref: {
					path: "doc-reader/docs/local/_index.md",
					storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
				},
				icon: null,
				title: "Быстрый старт",
				type: "category",
				pathname: "doc-reader/local",
				query: {},
				isCurrentLink: false,
				isExpanded: true,
				items: [
					{
						ref: {
							path: "doc-reader/docs/local/runup.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Подготовить окружение",
						type: "article",
						pathname: "doc-reader/local/runup",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/local/expander.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Развернуть приложение",
						type: "article",
						pathname: "doc-reader/local/expander",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/local/clone/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Склонировать каталог",
						type: "category",
						pathname: "doc-reader/local/clone",
						query: {},
						isCurrentLink: false,
						existContent: true,
						isExpanded: false,
						items: [],
						filter: null,
					},
				],
				existContent: false,
				filter: null,
			},
			{
				ref: {
					path: "doc-reader/docs/catalog/_index.md",
					storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
				},
				icon: null,
				title: "Работа с каталогом",
				type: "category",
				pathname: "doc-reader/catalog",
				query: {},
				isCurrentLink: false,
				existContent: true,
				isExpanded: true,
				items: [
					{
						ref: {
							path: "doc-reader/docs/catalog/sync.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Синхронизировать каталог",
						type: "article",
						pathname: "doc-reader/catalog/sync",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/catalog/add.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Сменить или добавить ветку",
						type: "article",
						pathname: "doc-reader/catalog/add",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/catalog/pull/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Опубликовать изменения",
						type: "category",
						pathname: "doc-reader/catalog/pull",
						query: {},
						isCurrentLink: false,
						existContent: true,
						isExpanded: false,
						items: [],
						filter: null,
					},
					{
						ref: {
							path: "doc-reader/docs/catalog/comments/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Комментарии",
						type: "category",
						pathname: "doc-reader/catalog/comments",
						query: {},
						isCurrentLink: false,
						existContent: true,
						isExpanded: false,
						items: [],
						filter: null,
					},
					{
						ref: {
							path: "doc-reader/docs/catalog/healthcheck.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Проверка на ошибки",
						type: "article",
						pathname: "doc-reader/catalog/healthcheck",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/catalog/noapp/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Настройки исходных файлов",
						type: "category",
						pathname: "doc-reader/catalog/noapp",
						query: {},
						isCurrentLink: false,
						existContent: true,
						isExpanded: false,
						items: [
							{
								ref: {
									path: "doc-reader/docs/catalog/noapp/multilang.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "Мультиязычность",
								type: "article",
								pathname: "doc-reader/catalog/noapp/multilang",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
							{
								ref: {
									path: "doc-reader/docs/catalog/noapp/private.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "Приватность",
								type: "article",
								pathname: "doc-reader/catalog/noapp/private",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
							{
								ref: {
									path: "doc-reader/docs/catalog/noapp/submodules/_index.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "Подмодули",
								type: "category",
								pathname: "doc-reader/catalog/noapp/submodules",
								query: {},
								isCurrentLink: false,
								existContent: true,
								isExpanded: false,
								items: [],
								filter: null,
							},
						],
						filter: null,
					},
				],
				filter: null,
			},
			{
				ref: {
					path: "doc-reader/docs/markdown/_index.md",
					storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
				},
				icon: null,
				title: "Разметка",
				type: "category",
				pathname: "doc-reader/markdown",
				query: {},
				isCurrentLink: false,
				existContent: true,
				isExpanded: true,
				items: [
					{
						ref: {
							path: "doc-reader/docs/markdown/notes.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Заметки",
						type: "article",
						pathname: "doc-reader/markdown/notes",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/links/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Ссылки",
						type: "category",
						pathname: "doc-reader/markdown/links",
						query: {},
						isCurrentLink: false,
						existContent: true,
						isExpanded: false,
						items: [],
						filter: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/terms.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Термины",
						type: "article",
						pathname: "doc-reader/markdown/terms",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/table.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Таблицы",
						type: "article",
						pathname: "doc-reader/markdown/table",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/video.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Видео",
						type: "article",
						pathname: "doc-reader/markdown/video",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/code.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Код",
						type: "article",
						pathname: "doc-reader/markdown/code",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/cut.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Скрытие фрагментов",
						type: "article",
						pathname: "doc-reader/markdown/cut",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/special.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Специальные элементы",
						type: "article",
						pathname: "doc-reader/markdown/special",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/article-block.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Вставка содержимого статей",
						type: "article",
						pathname: "doc-reader/markdown/article-block",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/fn-block.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Функциональные блоки",
						type: "article",
						pathname: "doc-reader/markdown/fn-block",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/variables.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Переменные",
						type: "article",
						pathname: "doc-reader/markdown/variables",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/formulas.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Формулы",
						type: "article",
						pathname: "doc-reader/markdown/formulas",
						query: {},
						isCurrentLink: false,
						alwaysShow: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/diagrams/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Диаграммы",
						type: "category",
						pathname: "doc-reader/markdown/diagrams",
						query: {},
						isCurrentLink: false,
						existContent: true,
						isExpanded: false,
						items: [
							{
								ref: {
									path: "doc-reader/docs/markdown/diagrams/tsDiagram.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "TS-диаграммы",
								type: "article",
								pathname: "doc-reader/markdown/diagrams/tsDiagram",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
							{
								ref: {
									path: "doc-reader/docs/markdown/diagrams/plantUml.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "Диаграммы PlantUML",
								type: "article",
								pathname: "doc-reader/markdown/diagrams/plantUml",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
							{
								ref: {
									path: "doc-reader/docs/markdown/diagrams/erDiagram.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "ER-диаграммы",
								type: "article",
								pathname: "doc-reader/markdown/diagrams/erDiagram",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
							{
								ref: {
									path: "doc-reader/docs/markdown/diagrams/c4Diagrams.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "C4 Structurizr",
								type: "article",
								pathname: "doc-reader/markdown/diagrams/c4Diagrams",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
							{
								ref: {
									path: "doc-reader/docs/markdown/diagrams/drawio.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "Диаграммы diagrams.net",
								type: "article",
								pathname: "doc-reader/markdown/diagrams/drawio",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
						],
						filter: null,
					},
					{
						ref: {
							path: "doc-reader/docs/markdown/dev/_index.md",
							storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
						},
						icon: null,
						title: "Разработчикам",
						type: "category",
						pathname: "doc-reader/markdown/dev",
						query: {},
						isCurrentLink: false,
						isExpanded: false,
						items: [
							{
								ref: {
									path: "doc-reader/docs/markdown/dev/tables.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "Описание схемы БД",
								type: "article",
								pathname: "doc-reader/markdown/dev/tables",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
							{
								ref: {
									path: "doc-reader/docs/markdown/dev/openapi.md",
									storageId: "Disk@C:/Users/danil.kazanov/Desktop/docreaderRepos/",
								},
								icon: null,
								title: "OpenAPI",
								type: "article",
								pathname: "doc-reader/markdown/dev/openapi",
								query: {},
								isCurrentLink: false,
								alwaysShow: null,
							},
						],
						existContent: false,
						filter: null,
					},
				],
				filter: null,
			},
		] as any[],
	} as HomePageData & ArticlePageData,
	openGraphData: {
		title: "",
		description: "",
	},
	context: {
		permissions: JSON.stringify({
			global: { type: PermissionType.plain, permissions: "" },
			enterprise: {},
		}),
		workspace: {
			current: "f",
			workspaces: [{ path: "f", name: "default workspace" }],
			defaultPath: "f",
			readResult: undefined,
		},
		currentWorkspace: "default-workspace",
		domain: "http://localhost:3000",
		isArticle: true,
		language: {
			ui: UiLanguage.ru,
			content: ContentLanguage.ru,
		},
		theme: "dark",
		isLogged: true,
		userInfo: {
			name: "Danil Kazanov",
			id: "30b4fbbd-8f92-4bd0-9dbb-ad895ac1ed91",
			mail: "danil.kazanov@ics-it.ru",
		},
		wordTemplates: [],
		conf: {
			basePath: "",
			bugsnagApiKey: "",
			authServiceUrl: "",
			cloudServiceUrl: "",
			diagramsServiceUrl: "",

			isSso: false,

			isRelease: false,
			isReadOnly: false,
			isProduction: false,

			ai: { enabled: false },

			version: "0.0.0@storybook",
			buildVersion: "0.0.0@storybook",
			enterprise: {
				gepsUrl: "",
				gesUrl: "https://test-ges-url.com",
			},
			metrics: {
				yandex: { metricCounter: "" },
				matomo: {
					matomoContainerUrl: null,
					matomoSiteId: null,
					matomoUrl: null,
				},
			},
			logo: {
				imageUrl: "",
				linkUrl: "",
				linkTitle: "",
			},
		},
		isReadOnly: false,
		isProduction: false,
		version: "2023.5.4",
		sourceDatas: [],
	} as PageDataContext,
};
