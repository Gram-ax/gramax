const parameterDescriptions = {
	catalogName: "Имя каталога из списка list_catalogs.",
	itemPath:
		"Путь к документу относительно каталога, без имени каталога в начале. Слеши как в URL, суффикс .md; для категории путь оканчивается на _index.md.",
} as const;

export const MCP_PROMPT_MAP = {
	browserNavigate: {
		description:
			"Открыть URL в скрытом браузере агента и вернуть новый снимок страницы: url, title, accessibilityTree, isBottomReached.",
		input: {
			url: "Полный URL страницы, начиная с http:// или https://.",
		},
	},
	browserReadPage: {
		description:
			"Получить полный снимок текущей страницы в браузере агента: url, title, accessibilityTree, isBottomReached.",
		input: {},
	},
	browserReadElement: {
		description:
			"Прочитать один интерактивный элемент по elementId из текущего снимка страницы. Возвращает только payload этого элемента.",
		input: {
			elementId: "ID элемента из accessibilityTree.",
		},
	},
	browserClick: {
		description:
			"Кликнуть по интерактивному элементу в браузере агента по elementId и вернуть обновлённый полный снимок страницы после стабилизации.",
		input: {
			elementId: "ID элемента из accessibilityTree.",
		},
	},
	browserType: {
		description:
			"Ввести текст в поле ввода или выбрать значение элемента в браузере агента по elementId и вернуть обновлённый полный снимок страницы после стабилизации.",
		input: {
			elementId: "ID элемента из accessibilityTree.",
			text: "Текст для ввода или значение для выбора.",
		},
	},
	browserScroll: {
		description:
			"Прокрутить текущую страницу в браузере агента вниз и вернуть обновлённый полный снимок страницы после стабилизации.",
		input: {},
	},
	readAgentAttachment: {
		description:
			"Прочитать прикрепленный к текущей сессии файл по имени. Ответ: content — текст файла. Без headingId — весь файл; с headingId (chunk~1, section-chunk~1, …) — чанк.",
		tooLarge:
			"Прикреплённый файл слишком большой. Возьми data.headings из этого ответа и повтори с более узким headingId.",
		input: {
			attachmentName: "Точное attachmentName из блока «Прикрепленные файлы». Не используй путь или другое имя.",
			headingId:
				"Необязательно: используй только если чтение всего файла вернуло ошибку. id чанка для чтения (chunk~1, section-chunk~1, …).",
		},
	},
	readAgentSkill: {
		description:
			"Прочитать полный текст agent skill по его имени. Используй, когда краткое описание skill релевантно задаче пользователя и нужны детальные инструкции.",
		input: {
			skillName: "Точное имя skill из блока «Доступные agent skills» в системном контексте.",
		},
	},
	listCatalogs: {
		description: "Список имён каталогов Gramax. Первый шаг навигации. Ответ: список каталогов (name, title).",
	},
	readCatalogItem: {
		description:
			"Прочитать узел каталога Gramax (статья .md или категория _index.md). Без headingId — полный markdown. С headingId из get_catalog_item_headings — глава или её чанк (id вида section-chunk~1).",
		tooLarge: "Фрагмент слишком большой. Повтори с более узким headingId.",
		input: {
			catalogName: parameterDescriptions.catalogName,
			itemPath: parameterDescriptions.itemPath,
			headingId: "Необязательно: id заголовка из get_catalog_item_headings.",
		},
	},
	getCatalogItemHeadings: {
		description:
			"Иерархия заголовков и чанков больших секций в статье/разделе. Ответ: дерево headings (id, level, title, children). Большие главы без детей разбиваются на id-chunk~1, id-chunk~2; у больших глав с детьми — читай дочерние id.",
		input: {
			catalogName: parameterDescriptions.catalogName,
			itemPath: "Путь к статье (.md) или разделу (_index.md) относительно каталога, без имени каталога в начале.",
		},
	},
	searchCatalogs: {
		description:
			"Полнотекстовый поиск по каталогам Gramax. Ответ: hits (catalogName, itemPath, title, snippets). catalogName и itemPath — для аргументов других инструментов, title для контекста. За один вызов поиска указывай в query ТОЛЬКО ОДНО слово.",
		input: {
			query: "Поисковая строка.",
			catalogName: "Ограничить одним каталогом из list_catalogs. Без параметра — поиск по всем каталогам.",
		},
	},
	getNavigation: {
		description:
			"Полное дерево навигации каталога. Ответ: root + tree с рекурсивными children; у каждого узла type, itemPath, title (itemPath — для аргументов инструментов, title — заголовок для контекста). Опциональный itemPath строит дерево от указанного узла.",
		input: {
			catalogName: parameterDescriptions.catalogName,
			itemPath:
				"Необязательный стартовый узел: относительный путь к категории (_index.md). Если не указан — строится от корня каталога.",
		},
	},
	deleteCatalogItem: {
		description:
			"Удалить статью или категорию (необратимо). Категория удаляется иерархически: вместе с вложенными подкатегориями и статьями. Если нужно удалить всё содержимое раздела, удаляй сам раздел одним вызовом. Успех: JSON с itemPath (нормализованный путь).",
		input: {
			catalogName: parameterDescriptions.catalogName,
			itemPath:
				"Относительно каталога, без имени каталога в начале. Слеши как в URL, суффикс .md; для удаления раздела/подраздела передавай путь категории, оканчивающийся на _index.md.",
		},
	},
	moveCatalogItem: {
		description:
			"Перенести статью или категорию в пределах каталога. Для категории перенос рекурсивный: вместе со всеми вложенными подкатегориями и статьями. Передавай конечный toItemPath целиком. Если toItemPath занят, инструмент возвращает ошибку и не переносит.",
		input: {
			catalogName: parameterDescriptions.catalogName,
			fromItemPath: "Текущий путь элемента относительно каталога. Статья — .md, категория — _index.md.",
			toItemPath:
				"Новый полный путь элемента относительно каталога. Для статьи должен оканчиваться на .md, для категории — на _index.md.",
		},
	},
	createCatalogItem: {
		description:
			"Создать пустую статью или подкатегорию. Успех: type (article|category), itemPath, content — начальный markdown в формате read_catalog_item; дополни и сохрани через write_catalog_item.",
		input: {
			catalogName: parameterDescriptions.catalogName,
			type: "article — новая статья (.md); category — новая вложенная категория (папка).",
			title: "Заголовок (title). Без слешей и без .md (Gramax добавит .md; иначе возможен …md.md). Нестандартные имена вроде «x.md.md» — целиком.",
			parentItemPath:
				"Родитель нового элемента: корень — пусто; иначе путь к _index.md категории (как itemPath в get_navigation).",
		},
	},
	writeCatalogItem: {
		description:
			"Крупные патчи в существующей статье или разделе. Два режима: с headingId — переписать одну главу (раздел по ATX-заголовку) вместе с подзаголовками; без headingId — переписать весь документ. При ошибке парсинга текст не обновляется. Успех: JSON с itemPath (и headingId, если передан).",
		input: {
			catalogName: parameterDescriptions.catalogName,
			itemPath: parameterDescriptions.itemPath,
			content:
				"Новый markdown. С headingId — только текст главы, как в read_catalog_item с тем же headingId: строка заголовка главы и её содержимое до следующего заголовка того же или более высокого уровня. Без headingId — полный документ с frontmatter.",
			headingId: "Необязательно: id заголовка из get_catalog_item_headings для замены одной главы.",
		},
	},
	replaceCatalogItem: {
		description:
			"Точечная текстовая замена в статье или _index.md по шаблону oldText -> newText. Используй для небольших правок по точному совпадению (строка, фрагмент). Для переписывания целой главы — write_catalog_item с headingId; для всего документа — write_catalog_item без headingId. Обязательный флаг replaceAll: false — ровно одна замена (если найдено больше 1 вхождения, инструмент вернет ошибку), true — массовая замена всех вхождений. При ошибке парсинга текст статьи не обновляется. Успех: JSON с itemPath, replacedCount, replaceAll.",
		input: {
			catalogName: parameterDescriptions.catalogName,
			itemPath: parameterDescriptions.itemPath,
			oldContent: `Точный текст для поиска и замены, не может быть пустым. Копируй текст из результата read_catalog_item буквально, символ в символ. НИКОГДА не применяй HTML-экранирование (&lt;, &gt;, &amp;) к <, >, & внутри oldContent и newContent.`,
			newContent: `Текст замены.`,
			replaceAll:
				"Обязательный флаг массовости: true — заменить все вхождения, false — заменить только одно. При false и количестве вхождений > 1 инструмент вернет ошибку.",
		},
	},
	getFilesNavigation: {
		description:
			"Список файлов и директорий внутри директории репозитория каталога. Ответ: root + tree с children; у каждого узла type, path, name (path — для аргументов read_file и get_files_navigation).",
		input: {
			catalogName: parameterDescriptions.catalogName,
			dirPath:
				"Необязательная стартовая директория: путь относительно корня каталога. Если не указан — список строится от корня каталога.",
		},
	},
	searchFiles: {
		description:
			"Полнотекстовый поиск по репозиторию указанного каталога. Ответ: hits (catalogName, filePath, snippets). За один вызов поиска указывай в query ТОЛЬКО ОДНО слово.",
		input: {
			query: "Поисковая строка.",
			catalogName: parameterDescriptions.catalogName,
		},
	},
	readFile: {
		description:
			"Прочитать файл из репозитория каталога. Без headingId — полный текст; с headingId из data.headings — чанк.",
		tooLarge: "Файл слишком большой. Возьми data.headings из этого ответа и повтори с более узким headingId.",
		input: {
			catalogName: parameterDescriptions.catalogName,
			filePath: "Путь к файлу относительно корня каталога.",
			headingId: "Необязательно: используй только если чтение всего файла вернуло ошибку.",
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
				"Необязательно: список путей файлов. Если не передан — действие применяется ко всем staged+unstaged изменениям в каталоге.",
		},
	},
	httpRequest: {
		description:
			"HTTP-запрос к внешнему API (аналог curl). ИСПОЛЬЗУЙ С ОСТОРОЖНОСТЬЮ. Ответ: status, statusText, ok (true для 2xx), body — текст ответа.",
		input: {
			url: "Полный URL, начинается с http:// или https://.",
			method: "Необязательно: метод запроса.",
			headers: 'Необязательно: объект HTTP-заголовков, например {"Authorization": "Bearer token"}.',
			body: "Необязательно: тело запроса строкой. Для JSON передай сериализованную строку и Content-Type: application/json в headers.",
		},
	},
	searchWeb: {
		description:
			"Поиск в интернете через внешний search API. Используй вместо сырого http_request, когда нужно найти веб-страницы по запросу. Ответ: query, results[{title, url}].",
		input: {
			query: "Поисковый запрос в свободной форме.",
			limit: "Необязательно: количество результатов. Если не передан, используется лимит по умолчанию.",
		},
	},
} as const;
