const aliases = {
	главной: "/",
	навигацию: ".scrolling-content .tree-root",
	редактор: ".ProseMirror, article",
	"редактор заголовка": ".article-title > div > div",
	публикация: '[data-qa="article-git-modal"]',
	комментарий: '[data-qa="qa-comment"]',
	"загружающийся каталог": '.spinner-loader div[data-qa="loader"]',
	"левую навигацию": ".left-navigation-layout .scrolling-content ul[class*='tree-root']",
	"левую панель": ".left-navigation-layout, .left-sidebar",
	"нижнюю панель": `[data-qa="qa-status-bar"]`,
	"правую панель": ".article-right-sidebar",
	"панель действий": '[data-qa="app-actions"]',
	"инлайновая панель": '[data-qa="qa-inline-wysiwyg-menu"]',
	"блок комментариев": ".comment-block",
	"история изменений": '[data-qa="article-git-modal"]',
	"окно добавления комментария": '[data-qa="qa-add-comment"]',
	"панель действий статьи": ".right-extensions",
	"слияние веток": ".picker",
	"верхнюю часть конфликта": ".top-part-conflict",
	"нижнюю часть конфликта": ".bottom-part-conflict",
	"добавление вкладки": '[data-qa="qa-add-tab"]',
	"удаление вкладки": '[data-qa="qa-del-tab"]',
	"переключить версию": '[data-qa="switch-version-warning"]',
	"переключатель языка контента": '[data-qa="switch-content-language"]',
	"добавление свойств": '[data-qa="qa-add-property"]',
	свойство: '[data-qa="qa-property"]',
	"диаграмма draw.io": '[data-qa="qa-drawio"]',
	"html блок": '[data-qa="qa-html"]',
	"выделить таблицу": '[data-qa="table-select-all"]',
	"действия каталога": '[data-qa="qa-catalog-actions"]',
	"действия статьи": '[data-qa="qa-article-actions"]',
	"смена ветки": '[data-qa="qa-branch"]',
	"нет изменений": '[data-qa="qa-no-changes"]',

	"%token%": process.env.GX_E2E_GITLAB_TOKEN,
	"%url%": process.env.GX_E2E_GITLAB_URL,
	"%group%": process.env.GX_E2E_GITLAB_GROUP,
	"%domain%": process.env.GX_E2E_GITLAB_DOMAIN,
	"%url_new%": process.env.GX_E2E_GITLAB_URL_NEW,
	"%push-repo%": process.env.GX_E2E_GITLAB_PUSH_REPO,
	"%test-repo%": process.env.GX_E2E_GITLAB_TEST_REPO,
	"%test-repo-no-index%": process.env.GX_E2E_GITLAB_TEST_REPO_NO_INDEX,

	"%next-login%": process.env.ADMIN_LOGIN,
	"%next-password%": process.env.ADMIN_PASSWORD,
} as Aliases;

const icons = {
	плюс: ".lucide-plus",
	коммент: ".lucide-message-square",
	"блок кода": ".lucide-code-xml",
	html: ".lucide-file-code",
	сниппеты: '[data-qa="qa-snippets"]',
	вкладка: ".lucide-app-window",
	"нумерованный список": ".lucide-list-ordered",
	"список задач": ".lucide-list-todo",
	"маркированный список": ".lucide-list",
	"новый комментарий": ".lucide-message-square",
	корзина: ".lucide-trash",
	корзина2: ".lucide-trash2",
	карандаш: ".lucide-pencil",
	ручка: ".lucide-pen",
	ссылка: ".lucide-link",
	"карандаш с линейкой": ".lucide-pencil-ruler",
	диаграммы: ".lucide-share2",
	"стрелка вправо": ".lucide-arrow-right",
	"диаграмма draw.io": `[data-qa="qa-edit-menu-diagrams.net"]`,
	"диаграмма mermaid": `[data-qa="qa-edit-menu-Mermaid"]`,
	"диаграмма plantuml": `[data-qa="qa-edit-menu-Plant-uml"]`,
	"диаграмма openApi": `[data-qa="qa-edit-menu-openApi"]`,
	заметка: ".lucide-sticky-note",
	"удалить форматирование": ".fa-text-slash",
	ножницы: ".lucide-scissors",
	крестик: ".lucide-x",
	"три точки": ".lucide-ellipsis",
	"вертикальные три точки": ".lucide-ellipsis-vertical",
	облачка: '[data-qa="qa-publish-trigger"]',
	синхронизации: ".lucide-refresh-cw",
	"зачёркнутого облачка": `[data-qa="qa-connect-storage"]`,
	отмена: ".lucide-reply",
	"отмена всех изменений": ".lucide-reply-all",
	лупы: ".lucide-search",
	галочка: ".lucide-check",
	"Вставить строку сверху": `[data-qa="table-add-row-up"]`,
	"удалить строку": `[data-qa="table-del-row"]`,
	"удалить столбец": `[data-qa="table-del-col"]`,
};

export type Aliases = { [key: string]: string };

export const globalAlias = (val: string) => aliases[val];

export const globalIcon = (shorthand: string) => {
	const name = icons[shorthand];
	if (!name) throw new Error("Invalid icon: '" + shorthand + "', supported: " + JSON.stringify(Object.keys(icons)));
	return name;
};
