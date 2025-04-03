import { it } from "@jest/globals";
import { GramaxCatalog } from "./GramaxCatalog";
import testModel1 from "./testModel1.json";
import testModel2 from "./testModel2.json";
import testModel3 from "./testModel3.json";

describe("GramaxCatalog", () => {
	it("should return correct number of articles", () => {
		const catalog = new GramaxCatalog(
			[{ path: "test", title: "test", parent: null, parsedContent: { editTree: testModel1 }, content: "test" }],
			"test",
		);
		expect(catalog.getAllArticles().length).toBe(1);
	});

	it("should return correct number of items for article", () => {
		const catalog = new GramaxCatalog(
			[{ path: "test", title: "test", parent: null, parsedContent: { editTree: testModel1 }, content: "test" }],
			"test",
		);
		const article = catalog.getAllArticles()[0];
		expect(article.getBlocks().length).toEqual(14);
	});

	it("should return correct items for article", () => {
		const catalog = new GramaxCatalog(
			[{ path: "test", title: "test", parent: null, parsedContent: { editTree: testModel1 }, content: "test" }],
			"test",
		);
		const blocks = catalog.getAllArticles()[0].getBlocks();

		expect(blocks[0].getPlainText()).toBe(
			"Gramax — это бесплатное приложение с открытым исходным кодом для создания, редактирования и публикации документации. Gramax чаще всего используется как:",
		);
		expect(blocks[0].getParent()).toBe(null);

		expect(blocks[1].getPlainText()).toBe("Портал документации о продукте.");
		expect(blocks[1].getParent()?.getPlainText()).toBe(
			"Gramax — это бесплатное приложение с открытым исходным кодом для создания, редактирования и публикации документации. Gramax чаще всего используется как:",
		);

		expect(blocks[2].getPlainText()).toBe("Внутренняя база знаний.");
		expect(blocks[2].getParent()?.getPlainText()).toBe(
			"Gramax — это бесплатное приложение с открытым исходным кодом для создания, редактирования и публикации документации. Gramax чаще всего используется как:",
		);

		expect(blocks[3].getPlainText()).toBe("Проектная документация.");
		expect(blocks[3].getParent()?.getPlainText()).toBe(
			"Gramax — это бесплатное приложение с открытым исходным кодом для создания, редактирования и публикации документации. Gramax чаще всего используется как:",
		);

		expect(blocks[4].getPlainText()).toBe("Персональные заметки.");
		expect(blocks[4].getParent()?.getPlainText()).toBe(
			"Gramax — это бесплатное приложение с открытым исходным кодом для создания, редактирования и публикации документации. Gramax чаще всего используется как:",
		);

		expect(blocks[5].getPlainText()).toBe("Начало работы");
		expect(blocks[5].getParent()?.getPlainText()).toBe(undefined);

		expect(blocks[6].getPlainText()).toBe("Создайте каталог.");
		expect(blocks[6].getParent()?.getPlainText()).toBe("Начало работы");

		expect(blocks[7].getPlainText()).toBe("Опубликуйте каталог в хранилище.");
		expect(blocks[7].getParent()?.getPlainText()).toBe("Начало работы");

		expect(blocks[8].getPlainText()).toBe("Разверните портал для читателей.");
		expect(blocks[8].getParent()?.getPlainText()).toBe("Начало работы");

		expect(blocks[9].getPlainText()).toBe("Загрузите каталог на созданный портал.");
		expect(blocks[9].getParent()?.getPlainText()).toBe("Начало работы");

		expect(blocks[10].getPlainText()).toBe("Компоненты");
		expect(blocks[10].getParent()?.getPlainText()).toBe(undefined);

		expect(blocks[11].getPlainText()).toBe(
			"Приложение Gramax. Позволяет пользователям создавать каталоги и редактировать статьи. Есть браузерная и десктопная версия для Windows, Mac, Linux.",
		);
		expect(blocks[11].getParent()?.getPlainText()).toBe("Компоненты");

		expect(blocks[12].getPlainText()).toBe(
			"Хранилище. С его помощью происходит синхронизация каталогов между пользователями. А также из хранилища информация публикуется на портал документации.",
		);
		expect(blocks[12].getParent()?.getPlainText()).toBe("Компоненты");

		expect(blocks[13].getPlainText()).toBe(
			"Портал документации. Это сайт, на котором читатели могут просматривать опубликованные материалы.",
		);
		expect(blocks[13].getParent()?.getPlainText()).toBe("Компоненты");
	});

	it("should return correct number of items for article with nested lists and notes", () => {
		const catalog = new GramaxCatalog(
			[{ path: "test", title: "test", parent: null, parsedContent: { editTree: testModel2 }, content: "test" }],
			"test",
		);
		const article = catalog.getAllArticles()[0];
		expect(article.getBlocks().length).toEqual(15);
	});

	it("should return correct items for article with nested lists and notes", () => {
		const catalog = new GramaxCatalog(
			[{ path: "test", title: "test", parent: null, parsedContent: { editTree: testModel2 }, content: "test" }],
			"test",
		);
		const blocks = catalog.getAllArticles()[0].getBlocks();

		expect(blocks[0].getPlainText()).toBe(
			"Поддерживается развёртывание на собственном сервере в Docker от версии 20.10.",
		);
		expect(blocks[0].getParent()?.getPlainText()).toBe(undefined);

		expect(blocks[1].getPlainText()).toBe(
			"Скачайте готовый файл командой curl -LO https://gram.ax/docker-compose.yaml.",
		);
		expect(blocks[1].getParent()?.getPlainText()).toBe(
			"Поддерживается развёртывание на собственном сервере в Docker от версии 20.10.",
		);

		expect(blocks[2].getPlainText()).toBe("docker-compose.yaml");
		expect(blocks[2].getParent()?.getPlainText()).toBe(
			"Скачайте готовый файл командой curl -LO https://gram.ax/docker-compose.yaml.",
		);

		expect(blocks[3].getPlainText()).toBe(
			"services:\n  gramax:\n    image: docker.io/gramax/gramax:latest\n    container_name: gramax\n    restart: unless-stopped\n    ports:\n      - ${PORT:-80}:${PORT:-80}\n    environment:\n      - PORT=${PORT:-80}\n      - ADMIN_LOGIN=${ADMIN_LOGIN:-admin}\n      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-password}\n      - AUTO_PULL_TOKEN=${AUTO_PULL_TOKEN:-}\n      - AUTO_PULL_INTERVAL=${AUTO_PULL_INTERVAL:-}\n    volumes:\n      - ${ROOT_PATH:-./gramax}:/app/data",
		);
		expect(blocks[3].getParent()?.getPlainText()).toBe("docker-compose.yaml");

		expect(blocks[4].getPlainText()).toBe("Задайте переменные среды:");
		expect(blocks[4].getParent()?.getPlainText()).toBe(
			"Поддерживается развёртывание на собственном сервере в Docker от версии 20.10.",
		);

		expect(blocks[5].getPlainText()).toBe(
			"ROOT_PATH — путь до папки, в которую будут склонированы каталоги. Если не указан, создается папка с названием gramax.",
		);
		expect(blocks[5].getParent()?.getPlainText()).toBe("Задайте переменные среды:");
		expect(blocks[5].getParent()?.getParent()?.getPlainText()).toBe(
			"Поддерживается развёртывание на собственном сервере в Docker от версии 20.10.",
		);

		expect(blocks[6].getPlainText()).toBe(
			"ADMIN_LOGIN — логин администратора. Если не указан, используется admin.",
		);
		expect(blocks[6].getParent()?.getPlainText()).toBe("Задайте переменные среды:");
		expect(blocks[6].getParent()?.getParent()?.getPlainText()).toBe(
			"Поддерживается развёртывание на собственном сервере в Docker от версии 20.10.",
		);

		expect(blocks[7].getPlainText()).toBe("Команды управления");
		expect(blocks[7].getParent()?.getPlainText()).toBe(undefined);

		expect(blocks[8].getPlainText()).toBe("Для запуска выполните команду docker compose up.");
		expect(blocks[8].getParent()?.getPlainText()).toBe("Команды управления");

		expect(blocks[9].getPlainText()).toBe("Чтобы остановить контейнеры, используйте docker compose down.");
		expect(blocks[9].getParent()?.getPlainText()).toBe("Команды управления");

		expect(blocks[10].getPlainText()).toBe(
			"Для обновления остановите контейнеры и выполните docker compose pull && docker compose up.",
		);
		expect(blocks[10].getParent()?.getPlainText()).toBe("Команды управления");

		expect(blocks[11].getPlainText()).toBe("Правила настройки");
		expect(blocks[11].getParent()?.getPlainText()).toBe("Команды управления");

		expect(blocks[12].getPlainText()).toBe("Правило 1");
		expect(blocks[12].getParent()?.getPlainText()).toBe("Правила настройки");
		expect(blocks[12].getParent()?.getParent()?.getPlainText()).toBe("Команды управления");

		expect(blocks[13].getPlainText()).toBe("Правило 2");
		expect(blocks[13].getParent()?.getPlainText()).toBe("Правила настройки");
		expect(blocks[13].getParent()?.getParent()?.getPlainText()).toBe("Команды управления");

		expect(blocks[14].getPlainText()).toBe("Правило 3");
		expect(blocks[14].getParent()?.getPlainText()).toBe("Правила настройки");
		expect(blocks[14].getParent()?.getParent()?.getPlainText()).toBe("Команды управления");
	});

	it("should return correct number of items for article with table", () => {
		const catalog = new GramaxCatalog(
			[{ path: "test", title: "test", parent: null, parsedContent: { editTree: testModel3 }, content: "test" }],
			"test",
		);
		const article = catalog.getAllArticles()[0];
		expect(article.getBlocks().length).toEqual(10);
	});

	it("should return correct items for article with table", () => {
		const catalog = new GramaxCatalog(
			[{ path: "test", title: "test", parent: null, parsedContent: { editTree: testModel3 }, content: "test" }],
			"test",
		);
		const blocks = catalog.getAllArticles()[0].getBlocks();

		expect(blocks[0].getPlainText()).toBe(
			"В визуальном редакторе Gramax можно добавить таблицу в несколько кликов. Gramax работает со стандартными Markdown-таблицами и добавляет расширенные возможности. Пример таблицы:",
		);
		expect(blocks[0].getParent()?.getPlainText()).toBe(undefined);

		expect(blocks[1].getPlainText()).toBe(
			`Наименование Тип данных Обязательное поле Комментарий
id integer Да Id отсутствия
absenceReason nvarchar(500) Да Причина отсутствия
statusId nvarchar(50) Нет Ссылка на статус`,
		);
		expect(blocks[1].getParent()?.getPlainText()).toBe(
			"В визуальном редакторе Gramax можно добавить таблицу в несколько кликов. Gramax работает со стандартными Markdown-таблицами и добавляет расширенные возможности. Пример таблицы:",
		);

		expect(blocks[2].getPlainText()).toBe("Добавить таблицу можно двумя способами:");
		expect(blocks[2].getParent()?.getPlainText()).toBe(undefined);

		expect(blocks[3].getPlainText()).toBe(
			"Создать вручную. Для этого кликните значок таблицы в панели редактирования, а затем оформите ее: добавьте строки и столбцы, определите заголовки, объедините ячейки.",
		);
		expect(blocks[3].getParent()?.getPlainText()).toBe("Добавить таблицу можно двумя способами:");

		expect(blocks[4].getPlainText()).toBe(
			"Перенести из Excel. Крупные таблицы можно просто перенести из любой другой системы. Для этого достаточно скопировать таблицу и вставить в статью в Gramax.",
		);
		expect(blocks[4].getParent()?.getPlainText()).toBe("Добавить таблицу можно двумя способами:");

		expect(blocks[5].getPlainText()).toBe("Закрепить markdown");
		expect(blocks[5].getParent()?.getPlainText()).toBe("Добавить таблицу можно двумя способами:");

		expect(blocks[6].getPlainText()).toBe("Если важно, чтобы в статье таблицы были именно в разметке Markdown:");
		expect(blocks[6].getParent()?.getPlainText()).toBe("Закрепить markdown");

		expect(blocks[7].getPlainText()).toBe("Не меняйте вручную ширину столбцов.");
		expect(blocks[7].getParent()?.getPlainText()).toBe(
			"Если важно, чтобы в статье таблицы были именно в разметке Markdown:",
		);
		expect(blocks[7].getParent()?.getParent()?.getPlainText()).toBe("Закрепить markdown");

		expect(blocks[8].getPlainText()).toBe("Не объединяйте ячейки в таблице.");
		expect(blocks[8].getParent()?.getPlainText()).toBe(
			"Если важно, чтобы в статье таблицы были именно в разметке Markdown:",
		);
		expect(blocks[8].getParent()?.getParent()?.getPlainText()).toBe("Закрепить markdown");

		expect(blocks[9].getPlainText()).toBe(
			"Именно эти действия форматируют Markdown-таблицу в расширенный синтаксис.",
		);
		expect(blocks[9].getParent()?.getPlainText()).toBe("Закрепить markdown");
		expect(blocks[9].getParent()?.getParent()?.getPlainText()).toBe("Добавить таблицу можно двумя способами:");
	});
});
