import { getExecutingEnvironment } from "@app/resolveModule/env";

const locale = {
	forms: {
		"catalog-edit-props": {
			name: "Настройки каталога",
			props: {
				title: {
					name: "Название каталога",
					placeholder: "Мой каталог",
					description: "Отображается на главной и в самом каталоге",
				},
				url: {
					name: "Название репозитория",
					placeholder: "Имя",
					description: "Системное название, задается при создании репозитория. Отображается в URL",
				},
				docroot: {
					name: "Директория",
					placeholder: "./",
					description: "Путь до директории, где будет храниться вся документация в репозитории",
				},
				description: {
					name: "Описание",
					placeholder: "Для личных заметок",
				},
				style: {
					name: "Стиль",
					placeholder: "Синий",
				},
				code: {
					name: "Краткое название",
					placeholder: "PN",
				},
			},
		},
		"review-edit-props": {
			name: "Поделиться ссылкой",
			props: {
				haveAccess: {
					name: "У получателя есть доступ к [$STORAGE_NAME]($STORAGE_URL)",
					description:
						"Если у получателя нет доступа, то в ссылку будет добавлен [токена для доступа к репозиторию]($ACCESS_TOKEN_DOCS) от вашего имени.",
				},
			},
		},
		"article-edit-props": {
			name: "Свойства",
			props: {
				title: {
					name: "Заголовок",
				},
				url: {
					name: "URL",
				},
			},
		},
		"git-source-data": {
			props: {
				sourceType: {
					name: "Тип",
				},
				url: {
					name: "URL сервера Git",
					placeholder: "https://git-server.com",
					description: "Скопируйте URL с главной страницы вашего хранилища",
				},
				token: {
					name: "Токен",
					placeholder: "glpat-aq6PK8sz1eQeKhTy-Dm5",
					description: "Токен для чтения и изменения репозиториев в хранилище.",
				},
				createDate: {
					name: "Время создания",
					placeholder: "1707213960",
					description: "Время получения токена",
				},
				refreshToken: {
					name: "Refresh-токен",
					placeholder: "4740fbc6db719d42c158b88580be7633c1e386827ebe9134e9a5198c52cb2e4c",
					description: "Токен для обновления основного токена",
				},
				userName: {
					name: "Имя пользователя",
					description: "Будет отображаться в истории изменений",
					placeholder: "Ivan Ivanov",
				},
				userEmail: {
					name: "Почта",
					description: "Будет отображаться в истории изменений",
					placeholder: "ivan.ivanov@mail.ru",
				},
			},
		},
		"gitlab-source-data": {
			props: {
				sourceType: {
					name: "Тип",
				},
				token: {
					name: "GitLab-токен",
					placeholder: "glpat-aq6PK8sz1eQeKhTy-Dm5",
					description:
						"Токен для чтения и изменения репозиториев в хранилище. Укажите для токена права: `api`, `read_repository`, `write_repository`. " +
						`<a ${
							getExecutingEnvironment() === "tauri" ? "" : "target='_blank'"
						} href='https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html'>Подробнее</a>`,
				},
				url: {
					name: "URL сервера GitLab",
					placeholder: "https://gitlab.com",
					description: "Войдите в GitLab и скопируйте URL с главной страницы.",
				},
				createDate: {
					name: "Время создания",
					placeholder: "1707213960",
					description: "Время получения токена",
				},
				refreshToken: {
					name: "Refresh-токен",
					placeholder: "4740fbc6db719d42c158b88580be7633c1e386827ebe9134e9a5198c52cb2e4c",
					description: "Токен для обновления основного токена",
				},
				userName: {
					name: "Имя пользователя",
					description: "Будет отображаться в истории изменений",
					placeholder: "Ivan Ivanov",
				},
				userEmail: {
					name: "Почта",
					description: "Будет отображаться в истории изменений",
					placeholder: "ivan.ivanov@mail.ru",
				},
			},
		},
		"admin-login-props": {
			name: "Вход в аккаунт",
			props: {
				login: {
					name: "Логин",
					placeholder: "Введите логин",
				},
				password: {
					name: "Пароль",
					placeholder: "Введите пароль",
				},
			},
		},
		"snippet-editor": {
			name: "Редактирование сниппета",
			props: {
				title: {
					name: "Название",
					placeholder: "Мой сниппет",
				},
				id: {
					name: "Id",
					placeholder: "my_Id",
				},
				content: {
					name: "<p>Содержимое</p>",
				},
			},
		},
		"snippet-add": {
			name: "Создание сниппета",
			props: {
				title: {
					name: "Название",
					placeholder: "Мой сниппет",
				},
				id: {
					name: "Id",
					placeholder: "my_Id",
				},
				content: {
					name: "<p>Содержимое</p>",
				},
			},
		},
		"ics-account-in": {
			name: "Сформировать аккаунт ICS",
			description: "Входные данные",
			props: {
				fullName: {
					name: "Имя и фамилия",
				},
			},
		},
		"ics-account-out": {
			name: "Результат выполнения",
			props: {
				fullName: {
					name: "Имя и фамилия",
				},
				email: {
					name: "Почта",
				},
				login: {
					name: "Логин",
				},
			},
		},
		"sign-in-enterprise": {
			name: "Вход для бизнеса",
			props: {
				email: {
					name: "Почта",
					placeholder: "Введите свою почту",
				},
			},
		},
	},
	app: {
		loading: "загружаем",
		error: {
			"browser-not-supported": {
				title: "Этот браузер не поддерживается",
				desc: "<span>Откройте Gramax в <a href='https://gram.ax/resources/docs/faq'>другом браузере</a> или </span><a href='https://gram.ax'> скачайте приложение</a><span>на компьютер</span>",
			},
			"unknown-error": "Неизвестная ошибка",
			"cannot-load": "Не удалось загрузить приложение",
			"command-failed": {
				title: "Что-то пошло не так",
				body: `<p>Перезагрузите страницу и попробуйте еще раз.</p><p>Мы получим сообщение о проблеме и постараемся ее быстро исправить. Если ошибка блокирует работу — напишите об этом в нашем <a href="https://t.me/gramax_chat">Telegram-чате</a>.</p>`,
			},
			"something-went-wrong": "Что-то пошло не так",
		},
	},
	workspace: {
		name: "Пространство",
		"default-name": "Основное пространство",
		"path-desc": "Директория на локальном диске, в которой находятся рабочие каталоги",
		selected: "Рабочая директория: ",
		add: "Добавить пространство",
		edit: "Настройки пространства",
		delete: {
			desktop: "Удалить пространство? Каталоги останутся на вашем компьютере",
			web: "Удалить пространство? Все каталоги в нем также удалятся",
		},
	},
	article: {
		create: {
			title: "Создать статью",
			body: "В левой навигации будут ваши разделы и статьи. Для начала создайте первую статью.",
		},
		title: "Заголовок статьи",
		"no-name": "Без названия",
		placeholder: "Текст статьи",
		"add-child": "Добавить дочернюю статью",
		"add-root": "Добавить статью в корень",
		configure: "Настройки статьи",
		"edit-markdown": "Редактировать Markdown",
		error: {
			parse: "Gramax не смог прочитать Markdown-конструкцию в файле статьи.\nКликните Редактировать Markdown, а затем исправьте ошибку или удалите конструкцию.",
			"resource-too-large": {
				title: "Не удалось добавить файл",
				desc: "`Размер файла превышает {{maxSizeMb}}мб. Сожмите его, выберите файл поменьше или воспользуйтесь десктопной версией.`",
			},
			"not-found": {
				title: "Статья не найдена",
				body: "Статья была перенесена или удалена. Перезагрузите страницу, чтобы получить изменения.",
			},
			"render-failed": "Не удалось отобразить статью",
		},
		custom: {
			"404": {
				body: `---
title: {{what}}
---
		
[alert:warning:Проверьте, что ссылка указана верно]
{{pathname}}

[/alert]`,
				article: {
					name: "Статья не найдена",
					body: `\`{{pathname}}\``,
				},
				catalog: {
					name: "Каталог не найден",
					body: `\`{{pathname}}\``,
				},
			},
			"403": `---
title: 403
---

Это приватная статья. Войдите в систему под аккаунтом с доступом или запросите права у автора.`,
			"500": {
				title: `---
title: Не удалось отобразить статью
---
`,
				body: `[alert:error:Gramax не смог обработать Markdown-конструкцию в файле статьи]\n\nИсправьте ошибку или удалите эту конструкцию в «Редактировать Markdown».\n\n[/alert]`,
			},
			"init-source": `---
title: Каталог уже связан с репозиторием
---

Мы определили, что каталог связан с репозиторием.
Но мы не знаем, в каком хранилище этот репозиторий находится.
Добавьте хранилище, чтобы подтвердить привязку.`,
		},
	},
	category: {
		configure: "Настройки категории",
	},
	catalog: {
		"new-name": "Новый каталог",
		new: "Создать новый",
		clone: "Загрузить",
		"clone-2": "Загрузить существующий",
		import: "Импортировать",
		add: "Добавить каталог",
		delete: "Удалить каталог",
		name: "каталог",
		configure: "Настроить каталог",
		style: {
			red: "Красный",
			blue: "Синий",
			black: "Черный",
			green: "Зеленый",
			purple: "Фиолетовый",
			"blue-pink": "Сине-розовый",
			"pink-blue": "Розово-синий",
			"blue-green": "Сине-зеленый",
			"red-green": "Красно-зеленый",
			"orange-red": "Оранжево-красный",
			"red-orange": "Красно-оранжевый",
			"blue-purple": "Сине-фиолетовый",
			"purple-blue": "Фиолетово-синий",
			"dark-orange": "Темно-оранжевый",
			"pink-purple": "Розово-фиолетовый",
			"orange-green": "Оранжево-зеленый",
			"green-orange": "Зелено-оранжевый",
			"bright-orange": "Светло-оранжевый",
			"purple-orange": "Фиолето-оранжевый",
		},
		"get-started": {
			editor: "С помощью Gramax можно создавать и редактировать документацию прямо в репозитории с кодом. Начать работу можно тремя способами:",
			"editor-desc":
				"<ul><li>Создайте каталог в Gramax и опубликуйте его в GitLab или GitHub.</li><li>Загрузите существующий репозиторий.</li><li>Импортируйте раздел из Confluence.</li></ul>",
			docportal: "Загрузите каталоги, которые будут видны читателям",
		},
		error: {
			"already-exist": "Такой каталог уже существует",
			"already-exist-2":
				"В хранилище % каталог % уже существует.\nИзмените «Название репозитория» в настройках каталога.",
		},
	},
	share: {
		name: "Поделиться",
		hint: "Также можно просто скопировать URL страницы",
		desc: "Убедитесь, что у получателя есть доступ к каталогу. Когда он перейдет по ссылке: если каталог не был загружен — он загрузится, если ветка не синхронизирована — Gramax предложит ее синхронизировать.",
		error: {
			"no-private-groups":
				"Не установленно ни одной приватной группы. Подробнее https://docs.ics-it.ru/doc-reader/catalog/private",
			"need-permission": "Нужен доступ к каталогу",
			"incorrect-ticket": "Некорректный тикет",
		},
	},
	diagram: {
		name: "Диаграмма",
		names: {
			c4: "C4 диаграмма",
			mermaid: "Mermaid диаграмма",
			puml: "PlantUml диаграмма",
			ts: "TS диаграмма",
			drawio: "Диаграмма diagrams.net",
		},
		error: {
			"render-failed": "Не удалось отобразить диаграмму",
			"cannot-get-data": "Проверьте, правильно ли указан путь, а также есть ли файл в репозитории.",
			"no-internet": "Проверьте подключение к интернету.",
			"invalid-syntax": "Проверьте синтаксис диаграммы.",
			"tabledb-render-failed": "Не удалось отобразить таблицу",
			"tabledb-file-not-found": "Не найден файл схемы по пути",
			"tabledb-not-found": "Таблица не найдена",
			"wrong-name": "Неправильное имя диаграммы",
			specification: "Не удалось отобразить спецификацию",
		},
	},
	"open-in": {
		web: "Открыть в веб-приложении",
		desktop: "Открыть в приложении",
		vscode: "Редактировать в VSCode",
		gramax: "Редактировать в Gramax",
		generic: "Открыть в",
		teams: "Открыть в Teams",

		error: {
			"cannot-open-desktop": {
				title: "Приложение не установлено",
				desc: "<a target='_blank' rel='noreferrer' href='https://gram.ax'>Скачайте приложение</a><span> и попробуйте еще раз.</span>",
			},
		},
	},
	"log-in": {
		github: "Войти в GitHub",
	},
	search: {
		name: "Поиск",
		open: "Открыть поиск",
		placeholder: "Введите запрос",
		desc: `<ul><li>Для поиска точного совпадения используйте <code>"</code>. Например:&nbsp;<code><nobr>"слово"</nobr></code> или <code><nobr>"искомая фраза"</nobr></code>.</li><li>Для исключения из поиска используйте <code>-</code>. Например:&nbsp;<code><nobr>-слово</nobr></code> или <code><nobr>-"исключенная фраза"</nobr></code>.</li></ul>`,
		"articles-not-found": "Статей не найдено",
		"all-catalogs": "Искать по всем каталогам",
	},
	list: {
		"no-items-found": "По запросу <strong>&quot;{{value}}&quot;</strong> совпадений не найдено.",
		"search-articles": "Ссылка или поиск по статьям",
	},
	git: {
		source: {
			error: {
				"cannot-create-repo": "Не удалось создать репозиторий",
				"storage-not-exist": `Хранилище с именем "{{storage}}" не существует. Добавьте его.`,
				"catalog-exist": `В хранилище {{storage}} каталог {{name}} уже существует.\nИзмените поле "Название репозитория" в настройках каталога.`,
				"cannot-bind-to-storage": `Нельзя привязать к этому хранилищу`,
				"unsupported-link": "Необходимо указать ссылку формата",
			},
		},
		clone: {
			"repo-link": "Ссылка на репозиторий",
			"not-cloned": {
				title: "Загрузить каталог?",
				body: "Ссылка ведет на каталог, который еще не загружен. Для просмотра и изменения нужно загрузить его из хранилища.",
			},
			error: {
				"cannot-clone": "Не удалось загрузить каталог",
				"already-exist": "Каталог с таким названием уже существует {{path}}",
				"no-permission": "Нет доступа к репозиторию {{url}}",
				generic: "Попробуйте обновить страницу и загрузить каталог заново.",
			},
		},
		sync: {
			error: {
				"local-changes-present": "Ваши локальные изменения не позволяют синхронизироваться",
			},
		},
		checkout: {
			conflict:
				"В текущей ветке есть неопубликованные изменения, которые конфликтуют с изменениями в другой ветке. Опубликуйте или отмените их.",

			"pathname-desc":
				"Если у вас есть неопубликованные изменения и они не конфликтуют с изменениями в другой ветке - они перенесутся.",
			error: { "local-changes-present": "Ваши локальные изменения не позволяют поменять ветку" },
		},
		branch: {
			error: {
				"deleting-head-branch":
					"Вы пытаетесь удалить ветку, на которой находитесь. Переключите её и попробуйте ещё раз",
				"cannot-delete-protected": `Ветка {{branch}} защищена от удаления. Снимите флаг с пункта "Удалить ветку {{branch}} после объединения" и попробуйте еще раз.`,
				"cannot-delete": "Не удалось удалить удалённую ветку {{branch}}",
				"not-found": {
					local: "Не удалось определить текущую ветку",
					remote: "Не удалось найти удалённую ветку для локальной ветки {{branch}}",
				},
				"already-exist": "Не удалось создать новую ветку. Ветка {{branch}} уже существует",
			},
		},
		merge: {
			merge: "Объединить",
			branches: "Объединить ветки",
			"current-branch": "Слить текущую ветку",
			"after-merge": "После объединения",
			conflict: {
				"abort-confirm": {
					title: {
						sync: "Отменить синхронизацию?",
						branch: "Отменить объединение веток?",
					},
					body: {
						sync: "При синхронизации возник конфликт. Для завершения синхронизации нужно его решить. Если это не сделать, каталог вернется в предыдущее состояние.",
						branch: "При объединении веток возник конфликт. Для завершения объединения нужно его решить. Если это не сделать, объединение отменится.",
					},
					"action-button": {
						sync: "Отменить синхронизацию",
						branch: "Отменить объединение",
					},
					"cancel-button": "Решить конфликт",
				},
				"current-change": "Текущее изменение",
				"incoming-change": "Входящее изменение",
				"accept-current-change": "Оставить текущее изменение",
				"accept-incoming-change": "Выбрать входящее изменение",
				"accept-both": "Выбрать оба изменения",
				"delete-in-current": "Файл был удален в текущем изменении, но изменен во входящем",
				"delete-in-incoming": "Файл был изменен в текущем изменении, но удален во входящем",
				"default-with-deletion-text": "Файл был удален или добавлен в текущем или входящем изменении",
				leave: "Оставить",
				"added-by-them": "У вас нет файла, который был добавлен или переименован во входящем изменении",
				"added-by-us": "Вы добавили или переименовали файл, которого нет во входящем изменении",
				"deleted-by-them": "Вы изменили файл, который удален или переименован во входящем изменении",
				"deleted-by-us": "Вы удалили или переименовали файл, который изменен во входящем изменении",
			},
			confirm: {
				sync: "У вас есть неопубликованные изменения, которые конфликтуют с изменениями в актуальном состоянии ветки. Решите конфликт перед синхронизацией.",
				branch: "Изменения в ветках конфликтуют. Решите конфликт перед объединением.",
			},
			error: {
				generic: "Не удалось слить ветки",
				"workdir-not-empty": "У вас есть локальные изменения. Отмените их и попробуйте ещё раз",
				"not-supported": "Ошибка при слиянии. Мы пока не умеем решать такие конфликты",
				"conflict-occured": "Не удалось автоматически решить конфликт слияния",
				"conflicts-not-found": "Не удалось получить конфликтующие файлы",
				branches: "Не удалось объединить ветки",
				sync: "Не удалось синхронизировать каталог",
			},
		},
		publish: {
			error: {
				"non-fast-forward":
					"У вас устаревшая версия каталога. Синхронизируйте его, затем опубликуйте изменения",
				unknown: "Неизвестная ошибка при публикации. Сообщение ошибки -",
				protected: "Ветка защищена от публикации",
				http: "Ошибка HTTP: {{status}}",
				"no-permission": "У вас нет прав для синхронизации с этим каталогом",
			},
		},
		history: {
			name: "История изменений",
			error: {
				"not-found": "Не удалось найти историю файла",
				"need-to-publish": "История изменений станет доступна после публикации статьи",
			},
		},
		discard: {
			confirm: "Отменить изменения? Статья вернется в предыдущее состояние, а добавленные медиафайлы удалятся.",
			"seletected-confirm":
				"Отменить выбранные изменения? Статьи вернутся в предыдущее состояние, а добавленные медиафайлы удалятся.",
		},
		error: {
			"not-found": {
				branch: "Не удалось найти ветку {{what}}",
				"remote-branch": "Не удалось найти удалённую ветку {{what}}",
				blob: "Не удалось найти файл {{path}}",
				generic: "Код ошибки - NotFoundError. Сообщение ошибки - ",
			},
			network: {
				title: "Нет интернета",
				message:
					"Для публикации, синхронизации, смены ветки и других операций с Git-хранилищем требуется интернет. Восстановите соединение и попробуйте еще раз.",
			},
		},
	},
	confluence: {
		blogs: "Блоги",
		"link-board": "Ссылка на доску",
		"log-in": "Войти в Confluence",
		error: {
			"ext-not-supported": "Расширение не поддерживается:",
			http: "Ошибка HTTP:",
			"http-2": "Ошибка HTTP при загрузке файла:",
			"cannot-import": {
				title: "Не удалось импортировать «{{name}}» из Confluence",
				desc: "Вы можете перенести его вручную со страницы ",
			},
		},
	},

	alert: {
		details: "Детали",
		image: {
			unavailable: "Не удалось отобразить изображение",
			path: "Проверьте, что оно существует и путь указан верно.",
		},
		video: {
			unavailable: "Не удалось отобразить видео",
			path: "Проверьте, что видео по ссылке существует и доступно для всех в интернете.",
		},
	},
	editor: {
		italic: "Курсив",
		bold: "Жирный",
		stroke: "Зачёркнутый",
		code: "Строка кода",
		"code-block": "Блок кода",
		"bullet-list": "Маркированый список",
		"ordered-list": "Нумерованный список",
		note: "Заметка",
		heading: "Заголовок",

		table: {
			name: "Таблица",
			row: {
				title: "Строка заголовка",
				"add-up": "Вставить строку сверху",
				"add-down": "Вставить строку снизу",
				"add-left": "Вставить строку слева",
				"add-right": "Вставить строку справа",
				delete: "Удалить всю строку",
			},
			column: {
				title: "Столбец заголовка",
				delete: "Удалить весь столбец",
			},
			"join-cells": "Объединить ячейки",
			"split-cells": "Разделить ячейки",
		},

		tabs: {
			name: "Вкладка",
			add: "Добавить новую вкладку",
			delete: "Удалить вкладку",
			"delete-last": "Вы удаляете последнюю вкладку. Удалить весь элемент?",
		},

		video: {
			name: "Видео",
			link: "Ссылка на видео",
			"will-be-here": "Тут будет ваше видео",
			"not-available": "Видео недоступной",
			error: {
				none: "В дополнительной панели укажите ссылку на него и добавьте подпись.",
				"none-2": "Из каких источников можно добавлять ссылки на видео читайте",
				"none-2-link": " в статье",
				some: "Проверьте наличие видео в файловом хранилище по",
				"some-link": " ссылке",
				"some-2": "Убедитесь, что в хранилище для ссылки/видео нет ограничений к доступу на просмотр.",
				generic: "Проверьте, правильно ли указано название файла.",
				"generic-2":
					"Убедитесь, что видео есть в соответствующей папке в SharePoint. Куда нужно поместить файл читайте",
				"generic-2-link": " здесь",
			},
		},
	},
	"bug-report": {
		name: "Сообщить об ошибке",
		submit: "Сообщить",
		"what-happened": "Что произошло",
		"what-will-be-sent": "Что отправится?",
		describe: "Опишите проблему или ошибку",
		"attach-tech-details": "Приложить технические детали",
		"this-will-help-us":
			"Эта информация поможет нам оперативнее решить ошибку. Мы не увидим контент или личные данные.",
		"view-tech-details": "Посмотреть детали.",
		error: {
			"cannot-send-feedback": "Не удалось отправить отчет об ошибке",
			"check-internet-or-adblocker": "Проверьте подключение к интернету и отключите блокировщики рекламы.",
		},
	},
	word: {
		"table-of-contents": "Оглавление",
		"error-rendering": "Ошибка: не удалось отрисовать ",
		diagram: "диаграмму",
		picture: "картинку",
		tabledb: "таблицу БД",
		snippet: "сниппет",
		video: "Видео",
		error: {
			"export-type-error": "Ошибка, такого типа экспорта нет: ",
		},
	},
	enterprise: {
		"incorrect-email": "Указана некорректная почта",
		"user-not-found":
			"Пользователь не найден. Укажите другую почту или продолжите использовать приложение без авторизации.",
		"workspace-exit-warning":
			"При выходе из рабочего пространства будут удалены все каталоги и будут потеряны локальные изменения.",
		"workspace-exit": "Выход из рабочего пространства",
		"check-if-user-editor-warning": "Убедитесь, что вам выдана лицензия редактора.",
		"access-restricted": "Доступ ограничен",
	},
	network: {
		error: {
			title: "Нет интернета",
			body: "Восстановите соединение и попробуйте еще раз.",
		},
	},
	account: "Аккаунт",
	add: "Добавить",
	apply: "Применить",
	article2: "Статья",
	article3: "статьёй",
	article4: "статьи",
	branch: "Ветка",
	cancel: "Отменить",
	category2: "разделом",
	category3: "раздела",
	checking: "Проверяем",
	close: "Закрыть",
	collapse: "Сворачивать",
	command: "Команда",
	comment: "Комментировать",
	company: "Внутренняя документация",
	configure: "Настроить",
	confirm: "Подтвердить",
	continue: "Продолжить",
	copied: "Скопировано",
	copy: "Скопировать",
	creating: "Создание",
	current: "Русский",
	delete: "Удалить",
	description: "Описание",
	discard: "Отменить изменения",
	edit2: "Редактировать",
	edit3: "Изменить",
	edit: "Отредактировать",
	editing: "Редактирование",
	element: "Элемент",
	enter: "Войти в",
	error: "Ошибка",
	existing: "существующий",
	exit: "Выход",
	expand: "Раскрыть",
	export: "Экспортировать",
	field: "Поле",
	file: "Файл",
	find: "Поиск",
	fn: "Функциональные блоки",
	formula: "Формулы",
	group2: "группы",
	group: "Группа",
	healthcheck: "Проверка на ошибки",
	hide: "Скрыть",
	icon: "Иконка",
	image: "Изображение",
	in: "в",
	interface: "Интерфейс",
	invalid2: "Некорректный",
	invalid: "Некорректное",
	language: "Язык",
	link2: "Ссылку",
	link: "Ссылка",
	load: "Загрузить",
	loading2: "Загружаем...",
	loading: "Загрузка...",
	local: "Локально",
	mail: "Почта",
	more: "Подробнее",
	name: "Название",
	ok: "Понятно",
	open: "Открыть",
	other: "Прочее",
	page: "Страница",
	products: "Продукты и сервисы",
	projects: "Проекты",
	publish: "Опубликовать",
	pull: "Pull",
	refresh: "Перезагрузить",
	remote: "Опубликовано",
	repository2: "репозитория",
	repository: "Репозиторий",
	resolve: " Решено ",
	save: "Сохранить",
	see: "См.",
	select: "Выбрать",
	send: "Отправить",
	signature: "Подпись",
	snippet: "Сниппет",
	source2: "Источника",
	source: "Источник",
	space: "Раздел",
	storage2: "хранилища",
	storage: "Хранилище",
	strike: "Зачеркнутый",
	style: "Стиль",
	switch: "Сменить",
	sync: "Синхронизировать",
	synchronization: "Синхронизация...",
	theme: "Тема",
	title: "Заголовок",
	token: "токен",
	type: "Тип",
	unresolve: "Нерешено",
	user: "Пользователь",
	value: "значение",
	values: "шт",
	version: "Версия",
	warning: "Предупреждение",
	who: "Кому",
	"add-account": "Добавить аккаунт",
	"add-annotation": "Добавить аннотацию",
	"add-new-branch": "Добавить новую ветку",
	"add-new-snippet": "Добавить новый сниппет",
	"add-new-source": "Добавить новый источник",
	"add-new-storage": "Добавить новое хранилище",
	"add-square": "Добавить квадрат",
	"add-storage": "Добавить хранилище",
	"add-to-continue-downloading": "Добавьте его, чтобы продолжить загрузку.",
	"add-value": "Добавить значение",
	"admin-login": "Вход",
	"admin-password": "Пароль",
	"admin-username": "Имя пользователя",
	"after-merge": "После объединения",
	"all-groups": "Все группы",
	"and-sync-catalog": "И синхронизировать каталог?",
	"annotation-text": "Текст аннотации",
	"article-titles": "Заголовки статьи",
	"article-to-docx": "Cтатью в DOCX",
	"article-to-pdf": "Cтатью в PDF",
	"authorization-by-mail": "Авторизация по почте",
	"bottom-left-pointer": "Нижняя левая аннотация",
	"bottom-right-pointer": "Нижняя правая аннотация",
	"branch-name-already-exists": "Ветка с таким названием уже существует",
	"branch-name-can-not-be-reserved-names": "Имя ветки не может совпадать с зарезервированными именами HEAD",
	"branch-name-can-not-have-dot-and-slash-at-end-and-contain-sequences-of-slashes":
		"Имя ветки не может заканчиваться на '/' или '.', а также содержать последовательности '//'",
	"branch-name-can-not-have-dots-sequence-and-leading-dot":
		"Имя ветки не может начинаться с точки или содержать последовательность двойных точек '..'",
	"branch-name-can-not-have-encoding-symbols":
		'Имя ветки не может содержать специальные символы, такие как пробел, *, ?, [], ~, :, ", <, >, |, ^, \\',
	"branch-name-can-not-have-existing-prefix-branch": "Имя ветки не может содержать префикс, как у существующей ветки",
	"branch-name-not-end-with-lock": "Имя ветки не может заканчиваться на '.lock'",
	"branches-are-updated": "Бренчи обновлены",
	"by-azure": "C помощью Azure",
	"by-mail": "По почте",
	"cancel-crop": "Отменить обрезку",
	"cant-be-same-name": "Имя должно быть уникальным",
	"cant-be-same-path": "Путь должен быть уникальным",
	"cant-edit-this-line": "Нельзя редактировать эту строку",
	"cant-get-snippet-data": "Проверьте, правильно ли указан путь, а также есть ли файл со сниппетом в репозитории",
	"catalog-icons-title": "Иконки каталога",
	"category-to-docx": "Раздел в DOCX",
	"change-and-sync": "Сменить и синхронизировать",
	"change-branch": "Сменить ветку",
	"check-diagrams": "Диаграммы",
	"check-file-path": "Проверьте правильно ли указан путь до файла",
	"check-fs": "Файловая структура",
	"check-icons": "Иконки",
	"check-images": "Изображения",
	"check-links": "Ссылки",
	"checkout-error": "Не удалось сменить ветку",
	"choose-header": "Выбрать заголовок",
	"clarifying-tags": "Уточняющие метки",
	"click-to-copy": "Нажмите, чтобы скопировать",
	"clone-branch-not-found":
		"Это может произойти в двух случаях: ветку удалили или создали, но не опубликовали. Запросите новую ссылку.",
	"clone-error-desc1": "Проверьте, существует ли репозиторий",
	"clone-error-desc2": "А также, убедитесь, что у вас есть права на его редактирование.",
	"clone-fail": "Не удалось загрузить каталог",
	"close-comment": "Закрыть комментарий",
	"close-with-changes":
		"Вы уверены, что хотите закрыть окно редактирования изображения? Несохраненные изменения будут потеряны.",
	"comments-to-article": "Замечание к статье",
	"commit-message": "Комментарий",
	"confirm-answer-delete": "Удалить комментарий?",
	"confirm-article-delete": "Удалить всю статью?",
	"confirm-category-delete": "Удалить весь раздел?",
	"confirm-comment-delete": "Удалить всю цепочку обсуждения?",
	"confirm-create-catalog-on-clone":
		"Gramax создаст в репозитории папку docs и добавит в нее системные файлы каталога. Затем вы сможете начать работу.",
	"confirm-create-catalog-on-clone-header": "В репозитории нет каталога. Создать?",
	"connect-storage": "Подключить хранилище",
	"connect-storage-to-leave-comment": "Подключите хранилище, чтобы оставить комментарий",
	"continue-confirm": "Вы уверены, что хотите продолжить?",
	"continue-locally": "Продолжить локально",
	"create-files-to-edit-markdown": "Добавьте статью для редактирования",
	"create-new2": "Создать каталог",
	"created-in-gramax": "Создано в Gramax",
	"crop-image": "Обрезать изображение",
	"current-branch": "Отображаемая ветка",
	"current-version": "Текущая версия",
	"danger-text": "Ошибка",
	"delete-answer": "Удалить ответ",
	"delete-as-resolved": "Удалить как решенный",
	"delete-branch": "Удалить ветку",
	"delete-file": "Удалить файл",
	"delete-local-catalog": "Этот каталог хранится только в приложении. Вы не сможете его восстановить.",
	"delete-snippet-confirm": "Вы уверены, что хотите удалить сниппет?",
	"delete-snippet-confirm-not-use": "Этот сниппет не используется ни в одной из статей",
	"delete-snippet-desc":
		"Вы собираетесь удалить сниппет, который в настоящее время используется в одной или более статьях",
	"delete-snippet-warn":
		"После удаления сниппета, в статьях, где он использовался, возникнут ошибки вместо отображения удаленного сниппета",
	"delete-storage-catalog": "Каталог удалится только из приложения. Но вы сможете его заново загрузить из хранилища.",
	"deleting-snippet-in-use": "Удаление используемого сниппета",
	"desktop-settings.target-directory-description":
		"Папка на локальном диске, в которой находятся каталоги для редактирования",
	"discard-selected": "Отменить выбранные изменения",
	"display-on-homepage": "Отображение на главной",
	"dont-save": "Не сохранять",
	"edit-on": "Редактировать в",
	"empty-field": "Пустое поле",
	"enter-branch-name": "Введите название ветки",
	"enter-snippet-text": "Введите текст сниппета",
	"error-expand": "Показать детали",
	"error-mail": "Указана некорректная почта",
	"error-occured": "К сожалению, при отображении документации возникла ошибка.",
	"export-catalog-docx": "Экспортировать каталог в DOCX",
	"file-content": "Контент файла",
	"file-download-error-message": "Возможно, он был перенесен или удален.",
	"file-download-error-title": "Не удалось скачать файл",
	"find-branch": "Поиск ветки",
	"for-certain-users": "Определенным пользователям",
	"foreign-key": "Внешний ключ FK",
	"generate-link": "Сформировать ссылку",
	"git-pull": "Git pull",
	"git-status": "Git status",
	"go-to-article": "Перейти к статье",
	"icon-cone": "Код иконки",
	"img-h": "Вертикальные группы картинок",
	"img-v": "Горизонтальные группы картинок",
	"in-article": "В статье",
	"in-branch": "В ветку",
	"in-the-right-panel": "в правой панели",
	"incorrects-icons": "Некорректные иконки",
	"incorrects-paths": "Некорректные пути",
	"info-text": "Информация",
	"init-git-version-control": "Инициализировать Git",
	"invalid-index": "Индекс не соответствует требованиям!",
	"lab-text": "Примечание",
	"leads-to-the-branch": "Вы переходите по ссылке, которая ведет на другую ветку.",
	"leave-comment": "Оставить комментарий",
	"leave-file": "Оставить файл",
	"link-end-date": "Указать срок действия ссылки",
	"mail-or-group": "Почта или Группа",
	"max-length": "Максимальное кол-во символов - ",
	"move-sidebar-down": "Переместить панель вниз",
	"must-be-not-empty": "Это поле не может быть пустым.",
	"no-access-to-storage": "Нет доступа к хранилищу",
	"no-branch-found": "Не найдено веток",
	"no-changes-in-catalog": "В текущем каталоге нет изменений",
	"no-encoding-symbols-in-url": "URL может содержать только латинские буквы, цифры и символы '-', '_'",
	"no-headers": "(Нет ни одного заголовка)",
	"no-schemas-block": "Не выводить блок «Schemas»",
	"no-such-function": "Такой функции нет!",
	"not-found": "Не найдено",
	"not-found2": "Не найдена",
	"note-text": "Предупреждение",
	"numbero-of-unsolved-comments": "Кол-во нерешенных комментариев",
	"on-the-same-version": "Находится на одной версии с этой веткой",
	"open-api": "OpenAPI",
	"other-version": "Другая версия",
	"publish-changes": "Опубликовать изменения",
	"quote-text": "Цитата",
	"remove-link": "Удалить ссылку",
	"repository-https-url": "HTTPS URL репозитория",
	"repository-ssh-url": "Repository SSH URL",
	"required-parameter": "Обязательный параметр",
	"resolve-conflict": "Решить конфликт",
	"return-sidebar": "Вернуть панель",
	"save-and-exit": "Сохранить и выйти",
	"save-article-in": "Сохранить статью в",
	"save-changes": "Сохранить изменения",
	"schemas-block": "Выводить блок «Schemas»",
	"select-all": "Выбрать все",
	"select-or-add-new": "Выберите или добавьте новые",
	"share-access-token-not-installed": "Share Access Token не установлен",
	"show-comment": "Показать комментарий",
	"show-comments": "Комментарии",
	"show-diffs": "Изменения",
	"sing-in": "Войти",
	"sing-out": "Выйти",
	"snippet-already-exists": "Сниппет с таким id уже существует",
	"snippet-render-error": "Не удалось отрисовать сниппет",
	"so-far-its-empty": "Пока что тут пусто",
	"storage-not-connected": "Хранилище не подключено",
	"submit-login-link": "Отправить ссылку для входа",
	"switch-branch": "Switch branch",
	"sync-catalog": "Синхронизировать каталог?",
	"sync-catalog-changed1": "файл доступен для синхронизации",
	"sync-catalog-changed2": "файла доступно для синхронизации",
	"sync-catalog-changed3": "файлов доступно для синхронизации",
	"sync-catalog-desc": "Версия каталога устарела. Чтобы получить изменения, синхронизируйте каталог.",
	"sync-logs": "Логи синхронизации",
	"sync-something-changed": "В репозитории что-то изменилось, но каталог все еще актуален",
	"system-icons-title": "Системные иконки",
	"takes-to-more-current-version": "Ведет на более актуальную версию каталога",
	"technical-details": "Технические детали",
	"tip-text": "Совет",
	"to-branch": "На ветку",
	"to-navigate": "Навигация",
	"to-сhange-click": "Для изменения кликните",
	"today-at": "Сегодня в ",
	"top-left-pointer": "Верхняя левая аннотация",
	"top-right-pointer": "Верхняя правая аннотация",
	"unable-to-get-sync-count": "Не удалось получить изменения для синхронизации",
	"unsaved-changes": "Сохранить изменения?",
	"unsupported-elements-confluence-title": "Некоторые элементы не перенесутся",
	"unsupported-elements-confluence1":
		"Gramax не поддерживает специфичные элементы из Confluence. Например: задачи из Jira, графики, отчеты. Данные из них вы можете перенести вручную.",
	"unsupported-elements-confluence2": "Список страниц с неподдерживаемыми элементами",
	"unsupported-elements-title": "Неподдерживаемые элементы",
	"unsupported-elements-warning1": "DOCX не поддерживает специальные элементы Gramax:",
	"unsupported-elements-warning2": "Файл сохранится без них.",
	"update-branches": "Обновить список веток",
	"users-group": "От какой группы дать права",
	"view-usage": "Посмотреть использования",
	"without-group": "Без группы",
	"working-directory": "Рабочая директория",
	"yesterday-at": "Вчера в ",
	"your-branch": "Ваша ветка",
};

export default locale;
