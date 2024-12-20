import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { DefaultLocale } from "@ext/localization/locale/translate";

const locale: DefaultLocale = {
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
				versions: {
					name: "Версии",
					placeholder: "releases/**/*",
					description:
						"Список версий (веток или тегов), отображаемых в докпортале. Задаются в виде glob-паттернов, например v19.* или release-*",
				},
				language: {
					name: "Основной язык",
					placeholder: "Русский",
					description: "Основной язык каталога. Нельзя изменить после выбора",
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
				properties: {
					name: "Свойства",
				},
				group: {
					name: "Группа",
					placeholder: "Группа",
					description: "Группа на главной странице, в которой будет отображаться",
				},
			},
		},
		"catalog-create-props": {
			name: "Настройки свойства",
			props: {
				name: {
					name: "Название",
					placeholder: "Введите название для свойства",
				},
				type: {
					name: "Тип",
					placeholder: "Флаг",
					description: "Нельзя изменить после сохранения",
				},
				icon: {
					name: "Иконка",
					placeholder: "Иконка",
				},
				style: {
					name: "Стиль",
					placeholder: "Синий",
				},
				values: {
					name: "Значения",
					placeholder: "Введите значение",
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
					placeholder: "glpat-aq6PK8sz1eQeKhTy-Dm5", // # gitleaks:allow
					description: "Токен для чтения и изменения репозиториев в хранилище",
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
					placeholder: "glpat-aq6PK8sz1eQeKhTy-Dm5", // # gitleaks:allow
					description:
						"Токен для чтения и изменения репозиториев в хранилище. Укажите для токена права: `api`, `read_repository`, `write_repository`. " +
						`<a ${
							getExecutingEnvironment() === "tauri" ? "" : "target='_blank'"
						} href='https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html'>Подробнее</a>`,
				},
				url: {
					name: "URL сервера GitLab",
					placeholder: "https://gitlab.com",
					description: "Войдите в GitLab и скопируйте URL с главной страницы",
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
		"confluence-server-source-data": {
			props: {
				sourceType: {
					name: "Тип",
				},
				domain: {
					name: "URL сервера Confluence",
					placeholder: "https://confluence.domain.com",
					description: "Скопируйте URL вашего Confluence сервера",
				},
				password: {
					name: "Пароль",
					placeholder: "opxsdk_tvdg",
					description: "Введите пароль аккаунта Confluence",
				},
				userName: {
					name: "Имя пользователя",
					placeholder: "Ivanov",
					description: "Введите имя пользователя аккаунта Confluence",
				},
				token: {
					name: "Токен",
					placeholder: "NzIzNTYyNTQ3NjQxOva29fNcHrLYMGH77/YuEAKpqy+Q",
					description: `Введите токен аккаунта Confluence. <a ${
						getExecutingEnvironment() === "tauri" ? "" : "target='_blank'"
					} href='https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html'>Подробнее</a>`,
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
					placeholder: "my_id",
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
					placeholder: "my_id",
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
			name: "Вход в бизнес-аккаунт",
			props: {
				email: {
					name: "Войдите в ваш корпоративный аккаунт Gramax Enterprise Server",
					description:
						"Используйте корпоративный email, чтобы подключиться к пространству вашей организации.",
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
		"continue-in-browser": {
			title: "Открыто в приложении Gramax",
			description: "Каталог уже открыт в десктопном приложении Gramax. Хотите продолжить в браузере?",
			action: "Продолжить в браузере",
		},
	},
	language: {
		name: "Язык",
		ru: "Русский",
		en: "English",
		zh: "中文",
		hi: "हिन्दी",
		es: "Español",
		fr: "Français",
		ar: "العربية",
		pt: "Português",
		de: "Deutsch",
		ja: "日本語",
		ko: "한국어",
		it: "Italiano",
		tr: "Türkçe",
		nl: "Nederlands",
		pl: "Polski",
		sv: "Svenska",
		cs: "Čeština",
	},
	"style-guide": {
		"check-with-style-guide": "Проверить по стайлгайду",
		"set-up-connection-and-style-guide": "Настройте подключение и правила",
		"check-article": "Проверить текущую статью",
		"set-up-style-guide": "Правила по стайлгайду",
		"set-up-connection": "Подключение к LLM",
		"style-guide-settings": "Правила по стайлгайду",
		"delete-text": "Предложено удалить фрагмент",
		"replace-text": "Предложение по замене",
		"LLM-provider": "LLM Provider",
		"enter-token": "Введите токен",
		"verifying-token": "Проверяем токен",
		"invalid-token": "Неверный токен",
		recommended: "Рекомендуемая",
		"settings-file": "Файл настроек",
		"invalid-file-format": "Неверный формат файла",
		"select-file": "Выберите файл",
		"no-file-selected": "Файл не выбран",
		"token-descriprion":
			"Ваш токен остается на вашем устройстве и не передается на наши серверы. Пожалуйста, храните ваш токен в безопасности и не делитесь им с другими.",
		"settings-description": `<p>Чтобы загрузить файл настроек стайлгайдов, выполните следующие шаги:</p>
<ol>
	<li>
		<p>
			Зайдите на
			<a
				target="_blank"
				href="https://check.gram.ax"
				rel="noreferrer"
			>
				check.gram.ax
			</a>
			и перейдите в раздел «Настройки».
		</p>
	</li>
	<li>
		<p>
			Настройте токены подключения к выбранному провайдеру LLM (например, OpenAI, Anthropic и др.).
		</p>
	</li>
	<li>
		<p>Создайте правила и протестируйте их работу.</p>
	</li>
	<li>
		<p>Экспортируйте файл настроек.</p>
	</li>
	<li>
		<p>Загрузите полученный файл в эту форму.</p>
	</li>
</ol>
<p>
	Подробнее читайте в
	<a
		target="_blank"
		rel="noreferrer"
		href="https://gram.ax/resources/docs/review/comments"
	>
		документации
	</a>
	.
</p>`,
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
		"edit-style": "Редактировать стили",
		"editing-css": "Редактирование CSS-стилей",
		"css-style": "CSS-стили",
		logo: "Логотип",
		appearance: "Внешний вид",
		"for-dark-theme-logo": "Для темной темы",
		"edit-css-styles": "Редактировать CSS-стили",
		"upload-logo": "Загрузить логотип",
	},
	multilang: {
		switch: "Переключить язык",
		warning: {
			action: {
				title: "Будет выполнено также для других языков",
				body: "Вы собираетесь изменить структуру каталога, который поддерживает несколько языков. Для корректного отображения каталога, файловая структура его локализаций должна быть одинаковой.",
			},
			delete: {
				title: "Удалить другие версии?",
				body: "Вы собираетесь выполнить действие над содержимым, которое имеет версии на других языках. Структура каталога на всех языках должна быть одинаковой, поэтому это действие будет выполнено также над содержимым на других языках.",
			},
		},
		"delete-confirm": "Вы уверены, что хотите удалить язык?",
		"add-localization": "Добавить язык",
		current: "Вы уже просматриваете этот язык",
		error: {
			"cannot-switch-to-self": "Нельзя удалить или переключиться на текущий язык",
			"cannot-add-language": "Нельзя добавить уже добавленный язык",
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
				title: {
					article: "Статья не найдена",
					catalog: "Каталог не найден",
				},
				"alert-title": "Проверьте, что ссылка указана верно",
				pathname: "Проверьте, что путь `{{pathname}}` действительно существует",
				"open-in-desktop":
					"Вы также можете [открыть этот путь в десктопном приложении Gramax](gramax://{{pathname}}) для редактирования на вашем компьютере",
			},
			"403": `---
title: 403
---

[alert:warning:Это приватная статья]\n\nВойдите в систему под аккаунтом с доступом или запросите права у автора.\n\n[/alert]`,
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
		name: "Поделиться каталогом",
		copy: "Ссылка для доступа к статье и каталогу на ветке ",
		hint: "Вы также можете скопировать ссылку напрямую из адресной строки браузера.",
		note: "Примечание:",
		desc: "<b>Примечание:</b> Убедитесь, что у получателя есть доступ к репозиторию в {{domain}} через <em>Access Token</em> с правами <code>read_api</code> и <code>write_repository</code>.",
		more: "Подробнее.",
		popover: "Скопировано в буфер обмена",
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
		gramax: "Редактировать в Gramax",
		generic: "Открыть в",
		teams: "Открыть в Teams",
		finder: "Показать в Finder",
		explorer: "Показать в проводнике",

		error: {
			"cannot-open-desktop": {
				title: "Приложение не установлено",
				desc: "<a target='_blank' rel='noreferrer' href='https://gram.ax'>Скачайте приложение</a><span> и попробуйте еще раз.</span>",
			},
		},
	},
	"log-in": "Войти в ",
	search: {
		name: "Поиск",
		open: "Открыть поиск",
		placeholder: "Введите запрос",
		desc: `<ul><li>Для поиска точного совпадения используйте <code>"</code>. Например:&nbsp;<code><nobr>"слово"</nobr></code> или <code><nobr>"искомая фраза"</nobr></code>.</li><li>Для исключения из поиска используйте <code>-</code>. Например:&nbsp;<code><nobr>-слово</nobr></code> или <code><nobr>-"исключенная фраза"</nobr></code>.</li></ul>`,
		"articles-not-found": "Статей не найдено",
		"all-catalogs": "Искать по всем каталогам",
	},
	list: {
		"no-results-found": "Ничего не найдено",
		"search-articles": "Ссылка или поиск по статьям",
	},
	versions: {
		switch: "Переключить версию",
		version: "Версия",
		"current-version": "Вы находитесь на этой версии",
		"not-actual-warning": {
			header: "Неактуальная версия",
			"1": "Вы просматриваете неактуальную версию ",
			"2": "<a data-qa href='{{link}}'>Переключите версию</a> для просмотра актуальной версии",
		},
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
			"open-in-app": "Вы также можете открыть этот каталог в десктопном приложении Gramax",
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
			"change-branch": "Сменить ветку",
			conflict:
				"В текущей ветке есть неопубликованные изменения, которые конфликтуют с изменениями в другой ветке. Опубликуйте или отмените их.",

			"pathname-desc":
				"Если у вас есть неопубликованные изменения и они не конфликтуют с изменениями в другой ветке - они перенесутся.",
			error: {
				"local-changes-present": "Ваши локальные изменения не позволяют поменять ветку",
				// conflict: "Есть неопубликованные изменения",
				conflict: "Не удалось сменить ветку",
			},
			submodule: {
				error: "<p>Не удалось сменить ветку на <b>master</b> или <b>main</b> в подмодуле {{path}}</p>",
			},
		},
		branch: {
			actual: "Актуальная ветка",
			error: {
				"deleting-head-branch":
					"Вы пытаетесь удалить ветку, на которой находитесь. Переключите её и попробуйте ещё раз",
				"cannot-delete-protected": `Ветка {{branch}} защищена от удаления. Снимите флаг с пункта "Удалить ветку {{branch}} после слияния" и попробуйте еще раз.`,
				"cannot-delete": "Не удалось удалить удалённую ветку {{branch}}",
				"not-found": {
					local: "Не удалось определить текущую ветку",
					remote: "Не удалось найти удалённую ветку для локальной ветки {{branch}}",
				},
				"not-found-reload": "Не удалось определить текущую ветку. Обновите страницу.",
				"already-exist": "Не удалось создать новую ветку. Ветка {{branch}} уже существует",
			},
		},
		merge: {
			"instant-merge": "Слить",
			merge: "Слить",
			branches: "Слить ветки",
			"after-merge": "После слияния",
			"current-branch": "Слить текущую ветку",
			"delete-branch-after-merge": "Удалить ветку после слияния",
			conflict: {
				"abort-confirm": {
					title: {
						sync: "Отменить синхронизацию?",
						branch: "Отменить слияние веток?",
					},
					body: {
						sync: "При синхронизации возник конфликт. Для завершения синхронизации нужно его решить. Если это не сделать, каталог вернется в предыдущее состояние.",
						branch: "При слиянии веток возник конфликт. Для завершения слияния нужно его решить. Если это не сделать, слияние отменится.",
					},
					"action-button": {
						sync: "Отменить синхронизацию",
						branch: "Отменить слияние",
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
				branch: "Изменения в ветках конфликтуют. Решите конфликт перед слиянием.",
				"catalog-conflict-state":
					"Ваш каталог находится в состоянии конфликта. Решите конфликт прежде чем продолжить редактирование.",
				"catalog-conflict-state-with-checkout":
					"<p>Ссылка ведет на ветку <code>{{branchToCheckout}}</code>, но ваш каталог находится в состоянии конфликта. Решите конфликт прежде чем продолжить редактирование.</p>",
			},
			error: {
				generic: "Не удалось слить ветки",
				"workdir-not-empty": {
					title: "У вас есть локальные изменения",
					body: "Опубликуйте или отмените локальные изменения. После этого объедините ветки.",
				},
				"not-supported": "Ошибка при слиянии. Мы пока не умеем решать такие конфликты",
				"conflict-occured": "Не удалось автоматически решить конфликт слияния",
				"conflicts-not-found": "Не удалось получить конфликтующие файлы",
				branches: "Не удалось слить ветки",
				sync: "Не удалось синхронизировать каталог",
				"catalog-conflict-state": "Решите конфликт",
			},
		},
		publish: {
			error: {
				"non-fast-forward": {
					title: "Устаревшая версия каталога",
					body: "Синхронизируйте каталог, чтобы получить изменения коллег. После этого опубликуйте свои изменения.",
				},
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
		warning: {
			"no-changes": {
				title: "Нет изменений",
				body: "В текущем каталоге нет изменений для публикации.",
			},
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
			"source-api": {
				title: "Ошибка при запросе к Git-хранилищу",
			},
		},
		"merge-requests": {
			create: "Создать запрос на слияние",
			approvedCountTooltip: "{{approvedCount}} из {{approvedTotal}} согласований",
			changes: "Изменения",
			back: "Назад",
			"create-request": "Создать запрос",
			by: "От",
			into: "в",
			you: "Вы",
			name: "Запрос на слияние",
			assignees: "Проверяющие",
			comments: {
				zero: "Нет комментариев",
				one: "комментарий",
				few: "комментария",
				many: "комментариев",
			},
			approval: {
				approved: "Согласован",
				unapproved: "Ожидает согласования",
			},
			status: {
				draft: "Черновик",
				"draft-tooltip": "Запрос на слияние ожидает публикации",
				"in-progress": "В процессе",
				"in-progress-tooltip": "Ожидает проверки и согласования",
				approved: "Согласован",
				"approved-tooltip": "Согласован всеми проверяющими и готово к слиянию",
			},
			"disable-button-reason": {
				"has-conflicts": "Необходимо решить конфликты перед слиянием",
				draft: "Нельзя слить черновик",
				"not-approved": "Нужно согласование всех проверяющих",
				"not-author": "Вы не автор этого запроса на слияние",
			},
			confirm: {
				title: "Слить ветки?",
				body: {
					"delete-branch-after-merge":
						"<p>Изменения из ветки <code>{{sourceBranch}}</code> попадут в ветку <code>{{targetBranch}}</code>, а ветка <code>{{sourceBranch}}</code> удалится. Отменить это действие не получится.</p>",
					"not-delete-branch-after-merge":
						"<p>Изменения из ветки <code>{{sourceBranch}}</code> попадут в ветку <code>{{targetBranch}}</code>. Отменить это действие не получится.</p>",
				},
			},
			warning: {
				"no-changes": {
					title: "Нет изменений",
					body: "В ветках нет изменений для слияния",
				},
			},
		},
	},
	confluence: {
		blogs: "Блоги",
		"link-board": "Ссылка на доску",
		error: {
			"ext-not-supported": "Расширение не поддерживается:",
			http: "Ошибка HTTP:",
			"couldnt-find-file": "Не удалось найти имя файла:",
			"couldnt-find-fileId": "Не удалось найти вложение с fileId:",
			"http-2": "Ошибка HTTP при загрузке файла:",
		},
	},
	import: {
		error: {
			"ext-not-supported": "Расширение не поддерживается:",
			"cannot-import": {
				title: "Не удалось импортировать элемент из ",
				desc: "Вы можете перенести его вручную со страницы",
			},
		},
	},
	"yandex-disk": {
		"log-in": "Войти в Яндекс.Диск",
	},
	"unsupported-elements": {
		confluence: {
			title: "Некоторые элементы не перенесутся",
			description:
				"Gramax не поддерживает специфичные элементы из Confluence. Например: задачи из Jira, графики, отчёты. Данные из них вы можете перенести вручную.",
			noteTitle: "Список страниц с неподдерживаемыми элементами",
		},
		notion: {
			title: "Некоторые элементы не перенесутся",
			description:
				"Gramax не поддерживает специфичные элементы из Notion. Например: кнопки, содержание. Данные из них вы можете перенести вручную.",
			noteTitle: "Список страниц с неподдерживаемыми элементами",
			"region-restricted": {
				title: "Доступ ограничен",
				message:
					"К сожалению, ваш запрос не может быть выполнен, так как доступ в Notion ограничен для вашего региона.",
			},
		},
		default: {
			title: "Некоторые элементы не перенесутся",
			description:
				"Gramax не поддерживает некоторые элементы из источника данных. Данные из них вы можете перенести вручную.",
			noteTitle: "Список неподдерживаемых элементов",
		},
	},

	alert: {
		details: "Детали",
		image: {
			unavailable: "Не удалось отобразить изображение",
			path: "Проверьте, что оно существует и путь указан верно.",
		},
		gif: {
			unavailable: "Не удалось отобразить Gif",
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
		"task-list": "Список задач",
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
			"Эта информация поможет нам оперативнее решить ошибку. Мы не увидим контент или личные данные. ",
		"view-tech-details": "Посмотреть детали",
		error: {
			"cannot-send-feedback": {
				title: "Не удалось отправить отчет об ошибке",
				message: "Возможно, у вас включен блокировщик рекламы. Отключите его и попробуйте еще раз.",
			},
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
			"canvas-to-blob-error": "Не удалось конвертировать canvas в Blob.",
			"canvas-error": "Не удалось получить контекст canvas.",
			"load-image-error": "Не удалось загрузить изображение.",
			"file-not-found-error": "Файл не найден по указанному пути.",
			"wrong-object-type": "Ошибка, такого типа объекта нет.",
			"divide-by-zero-error": "Ошибка деления на ноль.",
			"delete-failed-error": "Не удалось удалить файл",
		},
	},
	enterprise: {
		"user-not-found":
			"Эта почта не подключена к Gramax Enterprise Server. Вы можете продолжить работу в бесплатной версии приложения или обратиться к вашему администратору за помощью.",
		"workspace-exit-warning":
			"При выходе из рабочего пространства будут удалены все каталоги и будут потеряны локальные изменения.",
		"workspace-exit": "Выход из рабочего пространства",
		"check-if-user-editor-warning": "Убедитесь, что вам выдана лицензия редактора.",
		"access-restricted": "Доступ ограничен",
		"config-error": "Проблемы с настройками. Обратитесь к администратору.",
		"workspace-exists": "Энтерпрайз рабочее пространство уже существует.",
		"check-article": "Проверка статьи",
		"ges-settings": "Настройки входа в GES",
		"init-repo": {
			error: "Ошибка при создании репозитория",
			forbidden: "Недостаточно прав для создания репозитория",
			"already-exists": "Репозиторий с таким названием уже существует",
		},
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
	branches: "Ветки",
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
	filter: "Фильтр",
	copied: "Скопировано",
	copy: "Скопировать",
	creating: "Создание",
	current: "Русский",
	delete: "Удалить",
	description: "Описание",
	discard: "Отменить изменения",
	edit2: "Редактировать",
	actions: "Действия",
	edit: "Отредактировать",
	editing: "Редактирование",
	element: "Элемент",
	"enter-value": "Введите значение",
	error: "Ошибка",
	existing: "существующий",
	exit: "Выход",
	expand: "Раскрыть",
	export: "Экспортировать",
	field: "Поле",
	file: "Файл",
	find: "Поиск",
	find2: "Найти",
	replace: "Заменить",
	replaceAll: "Заменить все",
	caseSensitive: "С учетом регистра",
	wholeWord: "Слово целиком",
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
	link2: "Ссылку",
	link: "Ссылка",
	clickToViewDetails: "Кликните, чтобы посмотреть детали",
	load: "Загрузить",
	loading2: "Загружаем...",
	loading: "Загрузка...",
	loadWait: "Ожидает загрузки",
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
	forward: "Вперед",
	backward: "Назад",
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
	"after-merge": "После слияния",
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
	"check-diagrams": "Диаграммы",
	"check-file-path": "Проверьте правильно ли указан путь до файла",
	"check-fs": "Файловая структура",
	"check-icons": "Иконки",
	"check-images": "Изображения",
	"check-links": "Ссылки",
	"check-unsupported": "Неподдерживаемые элементы",
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
	"exit-edit-mode": "Вы уверены, что хотите выйти из режима редактирования?",
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
	"error-sing-in": "Ошибка входа",
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
	"go-to": "Перейти на",
	"icon-cone": "Код иконки",
	"img-h": "Вертикальные группы картинок",
	"img-v": "Горизонтальные группы картинок",
	"in-article": "В статье",
	"in-branch": "В ветку",
	"in-the-right-panel": "в правой панели",
	"incorrects-icons": "Некорректные иконки",
	"incorrects-paths": "Некорректные пути",
	"incorrects-unsupported": "Элементы",
	"info-text": "Информация",
	"init-git-version-control": "Инициализировать Git",
	"invalid-index": "Индекс не соответствует требованиям!",
	"invalid-credentials-title": "Не удалось подключиться",
	"invalid-credentials-text": "Пожалуйста, проверьте правильность введённых данных.",
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
	OpenApi: "OpenAPI",
	Html: "HTML",
	"Img-v": "Вертикальная группа картинок",
	"Img-h": "Горизонтальная группа картинок",
	Formula: "Формула",
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
	"snippet-render-error": "Не удалось отобразить сниппет",
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
	"unsupported-elements-title": "Неподдерживаемые элементы",
	"unsupported-elements-warning1": "DOCX не поддерживает некоторые элементы Gramax. Файл будет сохранен без них.",
	"unsupported-elements-warning2": "Список статей с неподдерживаемыми элементами",
	"update-branches": "Обновить список веток",
	"users-group": "От какой группы дать права",
	"view-usage": "Посмотреть использования",
	"without-group": "Без группы",
	"working-directory": "Рабочая директория",
	"yesterday-at": "Вчера в ",
	"your-branch": "Ваша ветка",
	"edit-html": "Редактировать HTML",
	"do-not-show-again": "Больше не показывать",
	properties: {
		name: "Свойства",
		all: "Все",
		empty: "(пусто)",
		"select-all": "(выбрать все)",
		"validation-errors": {
			"all-parameters-added": "Все параметры добавлены",
			"prop-creator": "Имя слишком короткое или такое свойство уже существует",
			"no-groupby": "Выберите поле для группировки",
			"no-defs": "Выберите хотя бы одно поле для фильтрации",
			"no-content": "Для выбранных полей нет элементов в каталоге",
		},
		system: {
			hierarchy: {
				name: "Иерархия",
				values: {
					"child-to-current": "Дочерние статьи текущей",
				},
			},
		},
		warning: {
			"delete-tag-from-catalog": {
				title: "Подтверждение удаления свойства",
				body: "Вы уверены, что хотите удалить свойство? Оно будет удалено со всех статей.",
			},
			"delete-value-from-catalog": {
				title: "Подтверждение удаления значения",
				body: "Вы уверены, что хотите удалить это значение? Оно будет удалено из всех статей.",
			},
		},
		view: {
			name: "Представление",
			"group-by": "Группировка",
			"order-by": "Сортировка",
			filter: "Фильтр",
			select: "Выборка",
			displays: {
				name: "Вид",
				list: "Список",
				table: "Таблица",
				kanban: "Доска",
			},
		},
		types: {
			Numeric: "Числовой",
			Flag: "Флаг",
			Date: "Дата",
			Enum: "Один из списка",
			Many: "Несколько из списка",
			Text: "Текст",
		},
		selected: "Выбрано",
		"not-selected": "Не выбрано",
		article: "Статья",
		archive: "Архивировать",
		"update-affected-articles": "статьи будут затронуты",
		"add-property": "Добавить свойство",
		"no-values": "Нет значений",
	},
	"create-new": "Создать новое",
	manage: "Управлять",
	change: "Изменить",
	"enter-number": "Введите число",
	"enter-text": "Введите текст",
	reset: "Сбросить",
	model: "Модель",
	"goto-original": "Перейти к оригиналу",
};

export default locale;
