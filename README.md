![Gramax logo](https://github.com/Gram-ax/gramax/assets/149784102/6e587f0c-f45e-4368-96cf-ec598fff16cf)

# Gramax

### Quickstart/Быстрый старт:

If you want to self-host gramax to make readonly instance of Gramax, you need Docker (Version 20.04 or higher) and sh if you Linux or macOS

Если вы хотите запустить на своем домене доступный только для чтения инстанс Gramax'а, вам нужен Docker (версии 20.04 или выше) и sh если вы используете Linux или macOS

### On Linux or macOS

Open your terminal and execute this command

Откройте ваш терминал и выполните команду

```bash
curl https://raw.githubusercontent.com/StanislavPetrovIcs/test-gramax-setup/main/setup.sh | bash; docker compose up
```

### On Windows

Open powershell and execute this command

Откройте powershell и выполните команду

```powershell
Invoke-Expression (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/StanislavPetrovIcs/test-gramax-setup/main/setup.ps1" -UseBasicParsing).Content; docker compose up
```

## Languages:

- [EN](#EN)
- [RU](#RU)

# EN

## Free text editor and doc portals for it-projects
Work collaboratively on documents in WYSIWYG or Markdown, control every change with Git, and use the Docs as Code approach for collaboration with colleagues and clients.

Gramax is a free text editor with a simple visual interface for Git commands. The text is stored in your chosen repository in Markdown files along with the code, versioned with the code, and changes are made within Git transactions.

## Usage Scenarios

The Gramax text editor enables managers and non-technical specialists to work with documentation as if it were code. No longer is there a need to learn specialized skills and install numerous programs to leave a comment or make changes to the content.

Technical specialists can continue to edit articles in Markdown markup through VSCode, IntelliJ, and other development environments (IDEs).

- **Knowledge Base**. Make changes to the knowledge base, with an integrated review process like that of developers.

- **Technical Specifications**. Gramax enables analysts and clients to work on a common project. Everyone can independently make their own changes.

- **Employee Training**. Create a portal with instructions for new employees and business processes.

- **Business Strategy**. Record all available information about the market and products, and describe the business strategy for the commercial department.

- **System Architecture Design**. Design and version architecture in the form of text, lists, code blocks, and diagrams.

- **Content for Websites and Presentations**. This site was compiled, elaborated, and verified in Gramax.

## Convenient Editor

Taking the best from Notion, Paper, Google Docs, and adding tools for professionals:

- Inline comments, collapsible blocks, notes, large tables.

- PlantUML diagrams, Draw.io, C4.

- Markdown editing.

Collaboration is built through asynchronous offline editing, thanks to which the editor works quickly and does not overwrite others' changes.

## Benefits

- **Confidentiality**. Gramax works directly with your selected Git repository. When working in the browser, data is stored in the local memory of the browser. In the app, it's on the disk of your device. When you finish your work, the changes synchronize with the Git repository. Interaction with our server occurs only to receive information about new versions.

- **Links Between Articles**. Create convenient links to articles in just a few clicks.

- **Storage in Your Infrastructure**. Work for free with your cloud or local GitHub, GitLab. Or deploy the Gramax server with Single Sign-On authentication and integrated Git storage.

- **Web Portal for Readers**. Separate portals can be deployed for external and internal readers. Organize access division by projects. Share secure links to articles or export them in .docx and .pdf.

- **Quick Search**. Allows editors and readers to search for information by project or across the entire knowledge base.

## Building and running

In order to run this project you need to clone repository, **download necessary tools** (or don't if you already have them ƪ(˘⌣˘)ʃ) and **install dependencies**.

On windows WSL is preferended, but not mandatory.

### You'll need the following tools:

  - Git
  - Node.js

### Installing dependencies

You can install dependencies via install-deps.sh (uses fd, so you need to have fd installed on your system before using it) or manualy by npm (no pnpm or yarn, sadly)

### Build Processes

#### Vite Build:
Location: `target/browser/`

- **Development Mode:** Run `npm run dev`
- **Production Build:** Execute `npm run run`

#### Next.js Build:
Location: `target/next/`

- **Development Mode:** Execute `npm run dev`
- **Production Build:** Run `npm run run`

## Contributing
There are you can [contribute](https://github.com/Gram-ax/gramax) to Gramax:
* Identify and Report Bugs: Notice something off? Report any bugs you find [here](https://github.com/Gram-ax/gramax/issues) or [here](https://t.me/gramax_chat) and assist our team in confirming bug fixes.
* Community Support on [Telegram](https://t.me/gramax_chat): Engage with the Gramax community. Offer support and share insights on Telegram.
* Feature Suggestions: Have ideas for new features or improvements? Share your thoughts and contribute to the project's growth.
* Code Contributions: If you're a developer, consider contributing code. Check out the project's GitHub repository for areas where you can contribute.
* Documentation: Help improve or expand the project's documentation, making it more accessible and understandable for new users.
* Spread the Word: Share your experiences with Gramax on social media or tech forums, helping to grow the user base and community.

## Contact
For any inquiries or contributions, please contact with as by [email](support@gram.ax).

# RU

## Бесплатный редактор текста и докпорталов для it-проектов

Работайте совместно над документами в WYSIWYG или Markdown, контролируйте каждое изменение с помощью Git, используйте подход Docs as Code для совместной работы с коллегами и заказчиками.

Gramax - это **бесплатный** текстовый редактор с простым визуальным интерфейсом для Git-команд. Текст хранится в выбранном вами хранилище в Markdown файлах вместе с кодом, версионируется вместе с кодом, а изменения вносятся в рамках Git-транзакций.

## Сценарии использования

Текстовый редактор Gramax даёт возможность менеджерам и нетехническим специалистам работать с документацией как с кодом. Больше не требуется обучаться специальным навыкам и установливать множество программ, чтобы оставить комментарий или внести изменения в контент.

Технические специалисты могут, как прежде, редактировать статьи в разметке Markdown через VSCode, IntelliJ и другие среды разработки (IDE).

-  **База знаний**. Вносите изменения в базу знаний, со встроенным процессом ревью как у разработчиков.

-  **Техническое задание.** Gramax даёт возможность аналитикам и заказчикам работать над общим проектом. Каждый может независимо вносить свои изменения.

-  **Обучение сотрудников**. Создайте портал с инструкциями для новых сотрудников и бизнес-процессов.

-  **Бизнес-стратегия**. Фиксируйте всю имеющуюся информацию о рынке и продуктах, описывайте бизнес-стратегию для коммерческого отдела.

-  **Проектирование системной архитектуры**. Проектируйте и версионируйте архитектуру в виде текста, списков, блоков кода и диаграмм.

-  **Контент для сайта и презентации**. Этот сайт был составлен, проработан и проверен в Gramax.

## Удобный редактор

Взяли лучшее из Notion, Paper, Google.Docs и добавили инструментов для профессионалов:

-  Инлайн-комментарии, скрывающиеся блоки, примечания, большие таблицы.

-  Диаграммы PlantUML, [Draw.io](http://Draw.io), C4.

-  Редактирование в Markdown.

Совместная работа строится через асинхронное офлайн редактирование, благодаря чему редактор быстро работает и не затирает чужие изменения.

## Преимущества

- **Конфиденциальность**. Gramax работает напрямую с выбранным Git-хранилищем. При работе в браузере данные хранятся в локальной памяти браузера. В приложении -- на диске вашего устройства. Когда вы завершили работу, то изменения синхронизируются с Git-хранилищем. Взаимодействие с нашим сервером происходит только для получения информации о новых версиях.

- **Ссылки между статьями**. Создавайте удобные ссылки на статьи в несколько кликов.

- **Хранение в вашей инфраструктуре**. Работайте бесплатно с вашим облачным или локальным GitHub, GitLab. Или разверните Gramax server с аутентификацией Single Sign-On и встроенным Git-хранилищем.

- **Веб-портал для читателей**. Можно развернуть отдельные порталы для внешних и внутренних читателей. Организовать разделение доступов по проектам. Делиться безопасными ссылками на статьи или экспортировать их в .doсx и .pdf.

- **Быстрый поиск**. Позволяет редакторам и читателям искать информацию по проекту или по всей базе знаний.

## Сборка и запуск

Для запуска проекта необходимо склонировать репозиторий, скачать необходимые инструменты (или не делать этого, если они у вас уже есть ƪ(˘⌣˘)ʃ) и **установить зависимости**.

На Windows предпочтительнее использовать WSL, но это не обязательно.

### Вам понадобятся следующие инструменты:

- Git
- Node.js

## Установка зависимостей

Вы можете установить зависимости через install-deps.sh (использует fd, так что вам нужно установить fd перед использованием) или вручную через npm.

### Cборка

#### Сборка Vite:

Расположение: `target/browser/`

- **Режим разработки:** Выполните `npm run dev`
- **Продакшн сборка:** Выполните `npm run run`

#### Сборка Next.js:

Расположение: `target/next/`

- **Режим разработки:** Выполните `npm run dev`
- **Продакшн сборка:** Выполните `npm run run`

## Участие в разработке
Вот как вы можете [внести свой вклад](https://github.com/Gram-ax/gramax) в развитие Gramax:
* Выявление и сообщение об ошибках: Заметили что-то неладное? Сообщите о любых найденных вами ошибках [здесь](https://github.com/Gram-ax/gramax/issues) или [здесь](https://t.me/gramax_chat) и помогите нашей команде подтвердить исправления.
* Поддержка сообщества в [Telegram](https://t.me/gramax_chat): Присоединяйтесь к сообществу Gramax. Предлагайте поддержку и делитесь своими идеями в Telegram.
* Предложения по функционалу: Есть идеи новых функций или улучшений? Поделитесь своими мыслями и внесите свой вклад в развитие проекта.
* Вклад в код: Если вы разработчик, рассмотрите возможность внесения своего кода. Ознакомьтесь с репозиторием проекта на GitHub, чтобы найти, где вы можете внести свой вклад.
* Документация: Помогите улучшить или расширить документацию проекта, сделав её более доступной и понятной для новых пользователей.
* Распространение информации: Делитесь своим опытом использования Gramax в социальных сетях или на технических форумах, помогая увеличить базу пользователей и сообщество.

## Контакты
Для всех запросов или предложений о сотрудничестве, пожалуйста, свяжитесь с нами по [электронной почте](support@gram.ax).
