export const MCP_PROMPT_MAP = {
	readAgentSkill: {
		description:
			"Прочитать полный текст agent skill по его имени. Используй, когда краткое описание skill релевантно задаче пользователя и нужны детальные инструкции.",
		input: {
			skillName: "Точное имя skill из блока «Доступные agent skills» в системном контексте.",
		},
	},
	deleteCatalogItem: {
		description:
			"Удалить статью или категорию (необратимо). Категория удаляется иерархически: вместе с вложенными подкатегориями и статьями. Если нужно удалить всё содержимое раздела, удаляй сам раздел одним вызовом. Успех: JSON с itemPath (нормализованный путь).",
		input: {
			catalogName: "Имя каталога из списка list_catalogs.",
			itemPath:
				"Относительно каталога, без имени каталога в начале. Слеши как в URL, суффикс .md; для удаления раздела/подраздела передавай путь категории, оканчивающийся на _index.md.",
		},
	},
	moveCatalogItem: {
		description:
			"Перенести статью или категорию в пределах каталога. Для категории перенос рекурсивный: вместе со всеми вложенными подкатегориями и статьями. Передавай конечный toItemPath целиком. Если toItemPath занят, инструмент возвращает ошибку и не переносит.",
		input: {
			catalogName: "Имя каталога из списка list_catalogs.",
			fromItemPath: "Текущий путь элемента относительно каталога. Статья — .md, категория — _index.md.",
			toItemPath:
				"Новый полный путь элемента относительно каталога. Для статьи должен оканчиваться на .md, для категории — на _index.md.",
		},
	},
	gitInspect: {
		description:
			"Просмотр git-состояния без изменений репозитория: общий список изменений (staged+unstaged) и file_diff. В status для каждого файла возвращаются added/deleted строки и общие totals.",
		input: {
			catalogName: "Имя каталога, где нужно посмотреть git-состояние.",
			action: "status | file_diff. Для file_diff обязательно передай filePath.",
			filePath:
				"Необязательно: путь файла для action=file_diff (можно относительный или полный путь внутри рабочего каталога).",
		},
	},
	gitDiscard: {
		description:
			"Откатить изменения (и staged, и unstaged): если передан filePaths — откатить только эти файлы, если filePaths не передан — откатить все изменения каталога. Инструмент destructive.",
		input: {
			catalogName: "Имя каталога, где нужно откатить изменения.",
			filePaths:
				"Необязательно: список путей файлов для отката. Если не передан, откатываются все staged+unstaged изменения в каталоге.",
		},
	},
	gitCommit: {
		description: "Сделать локальный commit. Перед коммитом проверь изменения через git_inspect.",
		input: {
			catalogName: "Имя каталога для локального commit.",
			message: "Сообщение commit (обязательно, не пустое).",
			filePaths:
				"Необязательно: список путей файлов для commit. Если не передан, инструмент коммитит текущие staged/unstaged изменения каталога.",
		},
	},
	readCatalogItem: {
		description:
			"Прочитать узел каталога Gramax (статья .md или категория _index.md). Ответ: JSON с массивом lines — элементы вида [номер_строки, текст], номер 1-based; без пары lineStart/lineEnd — весь документ, с парой — фрагмент включительно. Узкое чтение: сначала get_catalog_item_headings. У документа с заголовком первая строка в read обычно ATX H1 (# …). Номера строк одинаковы в read_catalog_item, get_catalog_item_headings и update_catalog_item.",
		input: {
			catalogName: "Имя каталога из списка list_catalogs.",
			itemPath:
				"Относительно каталога, без имени каталога в начале. Слеши как в URL, суффикс .md; категория — путь, оканчивающийся на _index.md.",
			lineStart:
				"Необязательно: первая строка фрагмента (1-based), вместе с lineEnd. Без пары — читается весь файл.",
			lineEnd: "Необязательно: последняя строка фрагмента включительно (1-based), вместе с lineStart.",
		},
	},
	getCatalogItemHeadings: {
		description:
			"Иерархия ATX-заголовков (#–######) в статье/разделе. Ответ: дерево headings (id, level, title, lineStart, lineEnd, children): lineStart — строка заголовка; lineEnd — конец секции до следующего заголовка с тем же или меньшим уровнем. У документа с заголовком первая строка в read обычно ATX H1 (# …). Номера строк одинаковы в read_catalog_item, get_catalog_item_headings и update_catalog_item. Используй lineStart/lineEnd в read_catalog_item и update_catalog_item.",
		input: {
			catalogName: "Имя каталога из списка list_catalogs.",
			itemPath: "Путь к статье (.md) или разделу (_index.md) относительно каталога, без имени каталога в начале.",
		},
	},
	createCatalogItem: {
		description:
			"Создать статью или подкатегорию (только создание). Родитель: parentItemPath к _index.md или корень. name без слешей; для статьи обычно основа без .md. Опционально content: начинай с ATX-заголовка — так задаётся заголовок материала; ниже тело. Успех: type (article|category), itemPath.",
		input: {
			catalogName: "Имя каталога из списка list_catalogs.",
			type: "article — новая статья (.md); category — новая вложенная категория (папка).",
			name: "Без слешей. category — имя папки. article — fileName: обычно основа без .md (Gramax добавит .md; иначе возможен …md.md). Нестандартные имена вроде «x.md.md» — целиком.",
			parentItemPath:
				"Родитель нового элемента: корень — пусто; иначе путь к _index.md категории (как itemPath в get_navigation).",
			content: "Необязательно: markdown. Первая строка — ATX-заголовок с названием материала, далее тело.",
		},
	},
	updateCatalogItem: {
		description:
			"Обновить тело статьи или _index.md. content — markdown без номеров строк в тексте; тот же вид, что возвращает read (включая первую строку-заголовок, если она есть). У документа с заголовком первая строка в read обычно ATX H1 (# …). Номера строк одинаковы в read_catalog_item, get_catalog_item_headings и update_catalog_item. 1-based: lineStart≤lineEnd — замена диапазона на content (разделитель \\n), пустой content удаляет строки; lineEnd=lineStart−1 — вставка перед lineStart; без пары — полная замена. Дописать в конец из N строк: lineStart=N+1, lineEnd=N. Первая непустая ATX-строка в передаваемом тексте задаёт заголовок документа. Успех: JSON с itemPath (+ lineStart/lineEnd при частичном update).",
		input: {
			catalogName: "Имя каталога из списка list_catalogs.",
			itemPath:
				"Относительно каталога, без имени каталога в начале. Слеши как в URL, суффикс .md; узел категории — путь, оканчивающийся на _index.md.",
			content: "Полная замена или фрагмент для диапазона. Номера строк только в аргументах lineStart/lineEnd.",
			lineStart:
				"Необязательно: начало диапазона (1-based), только вместе с lineEnd. Вставка перед строкой L: lineStart=L, lineEnd=L−1.",
			lineEnd:
				"Необязательно: конец диапазона включительно (1-based), или lineStart−1 для вставки перед lineStart.",
		},
	},
	searchCatalogs: {
		description:
			"Полнотекстовый поиск по каталогам Gramax. Ответ: hits (itemPath, title, snippets), truncated, totalMatched. Поле itemPath для инструментов, title для контекста. За один вызов поиска указывай в query ТОЛЬКО ОДНО слово.",
		input: {
			query: "Поисковая строка.",
			catalogName: "Ограничить одним каталогом из list_catalogs. Без параметра — поиск по всем каталогам.",
			itemPath:
				"Сузить поиск поддеревом (обязателен catalogName). Формат пути — как itemPath в read_catalog_item.",
		},
	},
	listCatalogs: {
		description:
			"Список имён локальных каталогов Gramax. Первый шаг навигации. Ответ: только catalogs (name, title).",
	},
	getNavigation: {
		description:
			"Полное дерево навигации каталога. Ответ: root + tree с рекурсивными children; у каждого узла type, itemPath, title (itemPath — для аргументов инструментов, title — заголовок для контекста). Опциональный itemPath строит дерево от указанного узла.",
		input: {
			catalogName: "Имя каталога из списка list_catalogs.",
			itemPath:
				"Необязательный стартовый узел: относительный путь к категории (_index.md). Если не указан — строится от корня каталога.",
		},
	},
} as const;
