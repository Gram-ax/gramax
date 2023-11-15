export function getAlternativeButton(actionName) {
	return {
		кнопку_домой: "home-page-button",

		заметку: "editor-button-note",
		таблицу: "editor-button-table-cells-large",
		блок_кода: "editor-button-code",
		блок_скрытого_текста: "editor-button-scissors",
		изображение: "editor-button-undefined",
		видео: "editor-button-video",
		маркированный_список: "editor-button-list-ul",
		нумерованный_список: "editor-button-list-ol",
		диаграммы: "editor-button-diagram-project",
		цитату: "editor-button-block-quote",
		удалить_форматирование: "editor-button-text-slash",

		удалить_активный_узел: "editor-button-trash",

		диаграмма_драв_ио: "editor-button-diagrams.net",
		диаграмма_тайп_скрипт: "editor-button-Ts-diagram",
		диаграмма_с4: "editor-button-C4-diagram",
		диаграмма_плант_ямл: "editor-button-Plant-uml"
	}[actionName];
}
