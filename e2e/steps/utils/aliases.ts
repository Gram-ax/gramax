const aliases = {
	главной: "/",
	навигацию: ".scrolling-content .tree-root",
	редактор: ".ProseMirror",
	публикация: '[data-qa="article-git-modal"]',
	"левую навигацию": ".left-navigation-layout .scrolling-content .tree-root",
	"левую панель": ".left-navigation-layout, .left-sidebar",
	"нижнюю панель": `[data-qa="qa-status-bar"]`,
	"правую панель": ".article-right-sidebar",
	"панель действий": '[data-qa="app-actions"]',
	"блок комментариев": ".comment-block",
	"история изменений": '[data-qa="article-git-modal"]',
	"панель действий статьи": ".right-extensions",
} as Aliases;

const icons = {
	плюс: ".fa-plus",
	"блок кода": ".fa-code",
	"нумерованный список": ".fa-list-ol",
	"маркированный список": ".fa-list-ul",
	корзина: ".fa-trash",
	диаграммы: ".fa-diagram-project",
	"диаграмма draw.io": `[data-qa="qa-edit-menu-diagrams.net"]`,
	"диаграмма mermaid": `[data-qa="qa-edit-menu-Mermaid"]`,
	заметка: ".fa-note",
	"удалить форматирование": ".fa-text-slash",
	ножницы: ".fa-scissors",
	"три точки": ".fa-ellipsis-h",
	облачка: ".fa-cloud-arrow-up",
	отмена: ".fa-reply",
};

export type Aliases = { [key: string]: string };

export const globalAlias = (val: string) => aliases[val];

export const globalIcon = (shorthand: string) => {
	const name = icons[shorthand];
	if (!name) throw new Error("Invalid icon: '" + shorthand + "', supported: " + JSON.stringify(Object.keys(icons)));
	return name;
};
