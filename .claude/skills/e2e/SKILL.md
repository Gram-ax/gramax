---
name: e2e
description: Use when user asks to write, create, run, or debug Playwright e2e tests in the Gramax project. Triggers on keywords like e2e, playwright, test, spec, QA.
---

# Writing E2E Tests

Framework: Playwright + custom fixtures/POMs. All tests in `e2e-pw/`.

## Workflow (MANDATORY)

The user is a QA tester who describes tests in human language. You translate intent into code. You decide ALL technical details (fixtures, POMs, locators).

### 1. Explore

Before anything else:
- Check similar tests in `e2e-pw/platforms/`
- Read relevant POMs for available methods
- Read app UI components to understand elements, roles, text content

### 2. Clarify ambiguities

If the request has gaps, present a **numbered questionnaire** in a single message. The user answers by number. Only ask about behavior/expectations, never about implementation.

**Must ask when:** platform unclear, scope ambiguous, expected result vague, multiple UI paths exist, locale matters.

Example questionnaire:
```
Before I write the test, I need to clarify a few things:

1. Platform: web or docportal?
2. You said "create catalog" — verify it appears in the list only, or also that it opens?
3. Should the test check the modal content, or just that the action completes?
```

Skip questions only if the request is unambiguous with explicit steps and expected results.

### 3. Plan in Plan Mode

Use `EnterPlanMode` to create the test plan. The plan must translate user's words into technical steps:

```
Test: <name>
Platform: web / docportal
Fixture: editorTest / homeTest / catalogTest / baseTest
Test data: <files/catalogs to create>

Steps:
1. <action>
2. <action>

Assertions:
- <assertion 1>
- <assertion 2>
```

Wait for user approval, then exit plan mode and write the test.

## Fixture Selection

```
Editor content/formatting     → editorTest
Home page / catalog list      → homeTest
Navigation inside a catalog   → catalogTest
Custom setup (web)            → baseTest
Docportal                     → baseTest (docportal)
```

### Hierarchy (web)

```
baseTest            — web context, files, localStorage
  ├─ homeTest       — + homePage (HomePage)
  ├─ catalogTest    — + catalogPage (CatalogPage)
  │    └─ editorTest — + editor (ArticleEditorPom)
  └─ (direct use for custom setups)
```

### Hierarchy (docportal)

```
baseTest — web context, API login/source setup
```

## Running Tests

```bash
cd e2e-pw
# Build & start: web (6001) / docportal (6003)
bun run web:build && bun run web:start
bun run docportal:build && bun run docportal:start

# Run
bunx playwright test --project=web                    # all web
bunx playwright test --project=web basic.spec.ts      # single file
bunx playwright test --project=web -g "test name"     # by name
bun run ui                                            # interactive UI
bunx playwright test --project=docportal-prepare --project=docportal
```

Projects: `web`, `web-enterprise`, `static` (port 6002), `docportal-prepare`, `docportal`, `docportal-enterprise`.

## Platforms

| Platform | Port | State | Setup |
|----------|------|-------|-------|
| web | 6001 | Reset each test (isolated) | `files` fixture via DOM |
| docportal | 6003 | Persistent | API setup, `docportal-prepare` |
| static | 6002 | Static build | Pre-built |

## Locators

Priority: `getByRole` > `getByText` > `getByPlaceholder` > `getByTestId` > `locator()`.

If element lacks role/text, **modify app code** to add semantics rather than `data-testid`.

```typescript
// GOOD
page.getByRole("button", { name: "Save" }).click();
page.getByText("Article Title").click();
// ACCEPTABLE
page.getByTestId("add-catalog").click();
// AVOID
page.locator(".btn-primary > span").click();
```

## Test Examples

**Editor:**
```typescript
import { editorTest } from "@web/fixtures/editor.fixture";
editorTest("does something", async ({ editor }) => {
  await editor.setMarkdown("Hello(*)");
  await editor.press("ControlOrMeta+B");
  await editor.type("bold");
  await editor.assertMarkdownContains("**bold**");
});
```

**Home/catalog:**
```typescript
import { homeTest } from "@web/fixtures/home.fixture";
homeTest.use({ files: { "my-catalog": { "article.md": "# Hello", "doc-root.yml": "title: My Catalog\n" } } });
homeTest("shows catalog", async ({ homePage }) => {
  await homePage.workspace.assertHasCatalogs(["my-catalog"]);
});
```

**Docportal:**
```typescript
import { baseTest as test } from "@docportal/fixtures/base.fixture";
test.use({ source: "env", user: "env" });
test("navigates", async ({ basePage }) => {
  const page = basePage.raw;
  await page.getByRole("button", { name: "Catalog" }).click();
  await basePage.waitForLoad();
});
```

## Fixtures

### Test data setup

**`files`** — inline file tree (primary method):
```typescript
homeTest.use({ files: { "catalog": { "art.md": "# Title", "doc-root.yml": "title: Cat\n" } } });
```
Keys = dirs/files, strings = content, objects = subdirs, `number[]` = binary.

**`dir`** — load from filesystem: `catalogTest.use({ dir: new URL("./test-catalog", import.meta.url) });`

**`zip`** — upload and extract ZIP file.

### Options (web)

`files`, `zip`, `dir`, `source` (`"env"` | SourceData), `isolated` (true), `isReadOnly` (false), `experimentalFeatures` (string[]), `startUrl` ("/").

Editor extras: `initMd` (string), `firstEnter` (true).

### Options (docportal)

`source`, `user` (`"env"` | AuthCredentials), `isolated` (true), `startUrl` ("/").

### Serial mode

`test.describe.configure({ mode: "serial" })` — when tests depend on each other.

### Step grouping

`await test.step("label", async () => { ... })` — for better reporting.

## POMs

**BaseSharedPage** (`shared-pom/page.ts`): `goto(path)`, `waitForLoad()`, `waitForUrl(url)`, `assertUrl(url)`, `assertNoModal()`, `navigate(path)` (pushState), `copyFileToClipboard(path)`, `raw` (Page), `modal` (Locator).

**HomePage** (`web/pom/home.page.ts`): `topBar` (TopMenu: `getAddCatalog()`, `getSwitchWorkspace()`, `getSwitchUiLanguage()`, `getSwitchTheme()`), `workspace` (WorkspacePom).

**CatalogPage** (`web/pom/catalog.page.ts`): `currentArticleContent(markdownOnly?)`, `getCatalogActions()`, `getCatalogProperties()`, `getNavTreeState(catalogName)`.

**ArticleEditorPom** (`web/pom/editor.pom.ts`): `setMarkdown(md, opts?)`, `markdown()`, `type(text)`, `press(keys)`, `focus()`, `pasteHtml(html)`, `pasteText(text)`, `forceSave()`, `clickToolbar(button)`, `hoverToolbar(button)`, `assertMarkdown(expected, opts?)`, `assertMarkdownContains(expected)`, `assertMarkdownValid()`, `bottom()`.

**WorkspacePom**: `assertHasCatalogs(names[])`, `assertCurrentWorkspace(config)`, `assertWorkspaces(configs[])`.

**CatalogPom** (`web/pom/catalog.pom.ts`): `props()`.

**Theme** (`shared-pom/theme.ts`): `assertHasTheme(theme)`, `assertThemeChanged()`, `switch(locator?)`.

### Atoms (shared-pom/atoms/)

**Dropdown**: `open()`, `close()`, `isOpen()`, `getItems()`, `findItemByTitle(title)`, `assertHasItem(item)`, `assertHasItems(items[])`, `assertTriggerVisible()`, `assertContentVisible()`, `assertContentHidden()`.

**DropdownItem**: `click()`, `hover()`, `assertVisible()`, `assertHidden()`. Props: `title`, `description`, `hasSubContent`.

**Button**: `click()`, `hover()`, `text()`, `assertVisible()`, `assertHasText(text)`.

**Select** (extends Dropdown): uses `select-content`/`select-item` test IDs.

## Editor Specifics

`(*)` in `setMarkdown` = cursor position. Keys: space-separated, modifiers with `+` (`ControlOrMeta+B`).

Toolbar buttons: `bold`, `italic`, `strikethrough`, `heading-2/3/4`, `bullet-list`, `ordered-list`, `task-list`, `code`, `table`, `note`, `diagrams`, `pencil-ruler`.

`md` template tag (`@utils/utils`) removes indentation from template literals.

## Conventions

1. One behavior per test
2. Use POMs, not raw locators
3. `getByRole`/`getByText` first — modify app for semantics if needed
4. `waitForLoad()` after navigation
5. `serial` only when order matters
6. `files` fixture for test data, not manual setup
7. Files: `<feature>.spec.ts`, group in `describe` blocks
8. **Do not modify test infrastructure (fixtures, POMs, utils, config) without asking.** Only `*.spec.ts` files can be created/edited freely.
9. For examining playwright's trace files use playwright skill
