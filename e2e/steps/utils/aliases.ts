const aliases = {
	главной: "/",
	навигацию: ".scrolling-content .tree-root",
	редактор: ".ProseMirror, article",
	"редактор заголовка": ".article-title > div > div",
	публикация: '[data-qa="article-git-modal"]',
	комментарий: '[data-qa="qa-comment"]',
	"левую навигацию": ".left-navigation-layout .scrolling-content .tree-root",
	"левую панель": ".left-navigation-layout, .left-sidebar",
	"нижнюю панель": `[data-qa="qa-status-bar"]`,
	"правую панель": ".article-right-sidebar",
	"панель действий": '[data-qa="app-actions"]',
	"инлайновая панель": '[data-qa="qa-inline-wysiwyg-menu"]',
	"блок комментариев": ".comment-block",
	"история изменений": '[data-qa="article-git-modal"]',
	"окно добавления комментария": '[data-qa="qa-add-comment"]',
	"панель действий статьи": ".right-extensions",
	"объединение веток": ".picker",
	"верхнюю часть конфликта": ".top-part-conflict",
	"нижнюю часть конфликта": ".bottom-part-conflict",
	"добавление вкладки": '[data-qa="qa-add-tab"]',
	"удаление вкладки": '[data-qa="qa-del-tab"]',
	"переключить версию": '[data-qa="switch-version-warning"]',
	"переключатель языка контента": '[data-qa="switch-content-language"]',
	"добавление свойств": '[data-qa="qa-add-property"]',
	свойство: '[data-qa="qa-property"]',

	"%token%": process.env.GX_E2E_GITLAB_TOKEN,
	"%url%": process.env.GX_E2E_GITLAB_URL,
	"%group%": process.env.GX_E2E_GITLAB_GROUP,
	"%domain%": process.env.GX_E2E_GITLAB_DOMAIN,
	"%url_new%": process.env.GX_E2E_GITLAB_URL_NEW,
	"%push-repo%": process.env.GX_E2E_GITLAB_PUSH_REPO,
	"%test-repo%": process.env.GX_E2E_GITLAB_TEST_REPO,

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
	карандаш: ".lucide-pencil",
	ручка: ".lucide-pen",
	ссылка: ".lucide-link",
	"карандаш с линейкой": ".lucide-pencil-ruler",
	диаграммы: ".lucide-share2",
	"диаграмма draw.io": `[data-qa="qa-edit-menu-diagrams.net"]`,
	"диаграмма mermaid": `[data-qa="qa-edit-menu-Mermaid"]`,
	заметка: ".lucide-sticky-note",
	"удалить форматирование": ".fa-text-slash",
	ножницы: ".lucide-scissors",
	"три точки": ".lucide-ellipsis",
	облачка: ".lucide-cloud",
	синхронизации: ".lucide-refresh-cw",
	"зачёркнутого облачка": ".lucide-cloud-off",
	отмена: ".lucide-reply",
	лупы: ".lucide-search",
};

export type Aliases = { [key: string]: string };

export const globalAlias = (val: string) => aliases[val];

export const globalIcon = (shorthand: string) => {
	const name = icons[shorthand];
	if (!name) throw new Error("Invalid icon: '" + shorthand + "', supported: " + JSON.stringify(Object.keys(icons)));
	return name;
};
