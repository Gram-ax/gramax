import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";
import { expect, type Locator, type Page, type Route } from "playwright/test";

// The editor route has no reachable Settings dialog (that's the home page's top bar only), so the UI language
// is switched by seeding the app's own persisted settings store (general.language) and reloading, so the app
// boots with that language. Written with evaluate() rather than addInitScript(): an init script stays
// registered for the whole page lifetime and would re-apply the language to every later test in this worker.
const setUiLanguage = async (page: Page, basePage: { waitForLoad: () => Promise<unknown> }, language: string) => {
	await page.evaluate((lang) => {
		window.localStorage.setItem(
			"app-settings-cache",
			JSON.stringify({ state: { values: { general: { language: lang } } }, version: 1 }),
		);
	}, language);
	await page.reload({ waitUntil: "domcontentloaded" });
	await basePage.waitForLoad();
};

// The modal shell renders before the lazy Monaco editor mounts. Every edit below addresses the editor's
// own DOM, so wait for it to be there instead of leaning on each locator's own timeout.
const waitForMonaco = async (modal: Locator) => {
	await expect(modal.locator('.monaco-editor[role="code"]')).toBeVisible();
	await expect(modal.locator(".inputarea.monaco-mouse-cursor-text")).toBeAttached();
};

const selectMonacoLine = async (modal: Locator, lineNumber: number, text: string): Promise<Locator> => {
	const monacoEditor = modal.locator('.monaco-editor[role="code"]');
	const monacoTextarea = modal.locator(".inputarea.monaco-mouse-cursor-text");
	await expect(monacoEditor).toBeVisible();
	const lineHeight = await monacoEditor
		.locator(".view-line")
		.first()
		.evaluate((line) => line.getBoundingClientRect().height);
	await monacoEditor
		.locator(".monaco-scrollable-element")
		.first()
		.evaluate((element, top) => element.scrollTo({ top, behavior: "auto" }), (lineNumber - 2) * lineHeight);
	const line = monacoEditor.getByText(text, { exact: text === "paths:" });
	await expect(line).toBeVisible();
	await line.click();
	return monacoTextarea;
};

// Several scenarios below navigate to their own pre-planted articles, and the page is worker-scoped, so the
// next test starts wherever the previous one stopped. The auto `reset` fixture does navigate back to
// startUrl, but it also re-plants the file tree, and racing that against the editor fixture's own reset
// leaves the block in an inconsistent state (observed: search filter silently not applied). Landing back on
// startUrl at the end of each test keeps that race out of the picture — an infra-level fix belongs in the
// shared fixtures, not here.
editorTest.afterEach(async ({ sharedPage, basePage, startUrl }) => {
	if (sharedPage.url().endsWith(startUrl)) return;
	await sharedPage.goto(startUrl, { waitUntil: "domcontentloaded" });
	await basePage.waitForLoad();
});

// The auto `reset` fixture only navigates to startUrl with waitUntil: "domcontentloaded" — it does not wait
// for the app itself to boot. Scenarios that take the `editor` fixture get that wait for free (it depends on
// catalogPage), but the ones that read a pre-planted article straight off sharedPage/basePage don't, and they
// start asserting against the "gramax loading.." splash. Against a production bundle the app usually wins that
// race; against the vite dev server it does not, and the failure reads as "element(s) not found", which looks
// like a product bug rather than a missing wait. Waiting here is a no-op once the app is already idle.
editorTest.beforeEach(async ({ basePage }) => {
	await basePage.waitForLoad();
});

// Every scenario here takes the `editor` fixture, and that fixture starts by wiping the article
// (`setMarkdown(initMd ?? "")`), so these tests never see the block planted in untitled.md — they insert a
// fresh one from the toolbar. The inserted block carries the node's own built-in demo spec, which is where
// "JSONPlaceholder API", "List posts" and "Get a post" come from: no file in the tree
// below is involved.
editorTest.describe("OpenApi", () => {
	editorTest("Inserted block survives goBack/goForward navigation", async ({ editor, basePage, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

		const openApiBlock = sharedPage.locator('[data-testid="open-api"]');

		await expect(openApiBlock).toBeVisible();
		await expect(basePage.modal).not.toBeVisible();

		// `forceSave` is a no-op until the editor has fired its first update -- `window.debug.forceSave`
		// is assigned there -- so flushing once can still race the insert. Poll the persisted article
		// instead: that the block reached the file is exactly what browser history depends on.
		await expect.poll(() => editor.markdown(), { timeout: 15_000 }).toContain("openapi");

		await sharedPage.goBack();
		await sharedPage.goForward();
		await basePage.waitForLoad();

		await expect(openApiBlock).toBeVisible();
		await expect(basePage.modal).not.toBeVisible();
	});

	editorTest("Inserting the block puts its operations in the table of contents", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

		await expect(sharedPage.getByTestId("table-of-contents")).toBeVisible();
		await expect(sharedPage.getByTestId("table-of-contents").getByText("Posts", { exact: true })).toBeVisible();
		await expect(sharedPage.getByTestId("table-of-contents").getByText("List posts")).toBeVisible();
	});

	editorTest("Inserted block renders the spec as documentation", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

		const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
		await expect(openApiBlock).toBeVisible();
		await expect(openApiBlock).toContainText("JSONPlaceholder API");
		await expect(openApiBlock).toContainText("List posts");
		await expect(openApiBlock.locator(".method").first()).toContainText("GET");
	});

	editorTest(
		"Editing the spec updates the documentation and the table of contents",
		async ({ editor, basePage, sharedPage }) => {
			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

			const openApiNode = sharedPage.locator(".node-openapi");
			await expect(openApiNode).toBeVisible();
			await openApiNode.hover();

			const nodeActions = openApiNode.locator('[data-qa="qa-node-actions"]');
			await expect(nodeActions).toBeVisible();

			const pencilIcon = nodeActions.getByTestId("edit-diagram");
			await expect(pencilIcon).toBeVisible();
			await pencilIcon.click();

			await expect(basePage.modal).toBeVisible();

			const monacoTextarea = await selectMonacoLine(basePage.modal, 25, "List posts");
			await monacoTextarea.press("End");
			await monacoTextarea.pressSequentially(" v2");

			await basePage.modal.getByRole("button", { name: "Save" }).click();
			await expect(basePage.modal).not.toBeVisible();

			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			await expect(openApiBlock).toContainText("List posts v2");
			await expect(sharedPage.getByTestId("table-of-contents").getByText("List posts v2")).toBeVisible();
		},
	);

	editorTest("Expanding an operation shows its response details", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

		const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
		await expect(openApiBlock).toBeVisible();

		const firstOperation = openApiBlock.locator(".op-card").first();
		await firstOperation.locator(".op-head").click();

		await expect(firstOperation.getByText("Responses")).toBeVisible();
		await expect(firstOperation.getByText("200", { exact: true })).toBeVisible();
	});

	editorTest(
		"Operation permalink remains open and positioned after page reload",
		async ({ editor, basePage, sharedPage }) => {
			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();
			await editor.forceSave();

			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			const target = openApiBlock.locator('api-operation[data-anchor-id="operation-getpost"]');
			const targetHead = target.locator(".op-head");
			const targetIsPositioned = () =>
				target.evaluate((element) => {
					const scrollContainer = document.querySelector<HTMLElement>(
						'[data-testid="article-scroll-container"]',
					);
					if (!scrollContainer) return false;
					const offset = element.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;
					return offset >= 0 && offset <= 24;
				});

			await openApiBlock.getByRole("link", { name: "Permalink to Get a post", exact: true }).click();

			await expect(sharedPage).toHaveURL(/#operation-getpost$/);
			await expect(targetHead).toHaveAttribute("aria-expanded", "true");
			await expect.poll(targetIsPositioned).toBe(true);

			await sharedPage.reload({ waitUntil: "domcontentloaded" });
			await basePage.waitForLoad();

			await expect(sharedPage).toHaveURL(/#operation-getpost$/);
			await expect(targetHead).toHaveAttribute("aria-expanded", "true");
			await expect.poll(targetIsPositioned).toBe(true);
		},
	);

	editorTest("Schemas checkbox toggles the schemas section", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

		const openApiNode = sharedPage.locator(".node-openapi");
		await expect(openApiNode).toBeVisible();
		await openApiNode.hover();

		const nodeActions = openApiNode.locator('[data-qa="qa-node-actions"]');
		const schemasToggle = nodeActions.getByTestId("toggle-schemas-block");
		await expect(schemasToggle).toBeVisible();

		const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
		await expect(openApiBlock.getByText("Schemas", { exact: true })).toBeVisible();

		await schemasToggle.click();
		await expect(openApiBlock.getByText("Schemas", { exact: true })).not.toBeVisible();

		await schemasToggle.click();
		await expect(openApiBlock.getByText("Schemas", { exact: true })).toBeVisible();
	});

	editorTest(
		"Heading button toggles API info and only persists the non-default value",
		async ({ editor, sharedPage }) => {
			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

			const openApiNode = sharedPage.locator(".node-openapi");
			await expect(openApiNode).toBeVisible();
			await openApiNode.hover();

			const nodeActions = openApiNode.locator('[data-qa="qa-node-actions"]');
			const infoToggle = nodeActions.getByTestId("toggle-openapi-info");
			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			const title = openApiBlock.getByRole("heading", { name: "JSONPlaceholder API", exact: true });

			await expect(infoToggle).toBeVisible();
			await expect(infoToggle).toHaveClass(/selected/);
			await expect(title).toBeVisible();
			await editor.forceSave();
			expect(await editor.markdown()).not.toContain("showInfo");

			await infoToggle.click();
			await expect(infoToggle).not.toHaveClass(/selected/);
			await expect(title).not.toBeVisible();
			await expect(openApiBlock.getByRole("heading", { name: "Operations", exact: true })).toBeVisible();
			await editor.assertMarkdownContains('showInfo="false"');

			await infoToggle.click();
			await expect(infoToggle).toHaveClass(/selected/);
			await expect(title).toBeVisible();
			await editor.forceSave();
			expect(await editor.markdown()).not.toContain("showInfo");
		},
	);

	editorTest(
		"Invalid spec shows a diagnostic instead of crashing the article",
		async ({ editor, basePage, sharedPage }) => {
			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

			const openApiNode = sharedPage.locator(".node-openapi");
			await expect(openApiNode).toBeVisible();
			await openApiNode.hover();

			const nodeActions = openApiNode.locator('[data-qa="qa-node-actions"]');
			await nodeActions.getByTestId("edit-diagram").click();

			await expect(basePage.modal).toBeVisible();
			// Renaming the top-level `paths` key keeps the YAML valid while removing the field OpenAPI requires.
			const monacoTextarea = await selectMonacoLine(basePage.modal, 19, "paths:");
			await monacoTextarea.press("Home");
			await monacoTextarea.pressSequentially("x");

			await basePage.modal.getByRole("button", { name: "Save" }).click();
			await expect(basePage.modal).not.toBeVisible();

			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			await expect(openApiBlock).toBeVisible();
			await expect(openApiBlock).toContainText("Failed to display the OpenAPI specification");
			await expect(openApiBlock).toContainText("no paths section with API operations");

			await openApiBlock.getByText("Details").click();
			await expect(openApiBlock).toContainText("paths object");
		},
	);

	editorTest(
		"Fixing a syntactically broken spec clears the error instead of staying stuck",
		async ({ editor, basePage, sharedPage }) => {
			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

			const openApiNode = sharedPage.locator(".node-openapi");
			await expect(openApiNode).toBeVisible();
			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			const nodeActions = openApiNode.locator('[data-qa="qa-node-actions"]');

			// Break YAML syntax with a single-line edit: drop the closing quote of the first line,
			// leaving an unterminated string — invalid YAML, not just an OpenAPI spec missing a field.
			await openApiNode.hover();
			await nodeActions.getByTestId("edit-diagram").click();
			await expect(basePage.modal).toBeVisible();
			await waitForMonaco(basePage.modal);
			let monacoEditor = basePage.modal.locator('.monaco-editor[role="code"]');
			let monacoTextarea = basePage.modal.locator(".inputarea.monaco-mouse-cursor-text");
			await monacoEditor.getByText('openapi: "3.0.0"', { exact: true }).click();
			await monacoTextarea.press("End");
			await monacoTextarea.press("Backspace");
			// The preview classifies the broken spec while typing, before anything is saved.
			await expect(basePage.modal).toContainText("Failed to display the OpenAPI specification");
			await basePage.modal.getByRole("button", { name: "Save" }).click();
			await expect(basePage.modal).not.toBeVisible();

			await expect(openApiBlock).toContainText("Failed to display the OpenAPI specification");
			await openApiBlock.getByText("Details", { exact: true }).click();
			await expect(openApiBlock).toContainText(/YAML syntax error: line \d+, column \d+/);

			// Fix it back with the matching single-line edit and save again.
			await openApiNode.hover();
			await nodeActions.getByTestId("edit-diagram").click();
			await expect(basePage.modal).toBeVisible();
			await waitForMonaco(basePage.modal);
			monacoEditor = basePage.modal.locator('.monaco-editor[role="code"]');
			monacoTextarea = basePage.modal.locator(".inputarea.monaco-mouse-cursor-text");
			await monacoEditor.getByText('openapi: "3.0.0', { exact: true }).click();
			await monacoTextarea.press("End");
			await monacoTextarea.pressSequentially('"');
			await expect(basePage.modal).not.toContainText("Failed to display the OpenAPI specification");
			await basePage.modal.getByRole("button", { name: "Save" }).click();
			await expect(basePage.modal).not.toBeVisible();

			await expect(openApiBlock).not.toContainText("Failed to display the OpenAPI specification");
			await expect(openApiBlock).toContainText("JSONPlaceholder API");
		},
	);

	editorTest(
		"Search input filters operations and TOC navigation resets an active filter",
		async ({ editor, sharedPage }) => {
			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			await expect(openApiBlock).toBeVisible();
			await expect(openApiBlock.locator(".op-card")).toHaveCount(2);

			const searchInput = openApiBlock.locator(".search-input");
			await searchInput.fill("Get a post");

			await expect(openApiBlock.locator(".op-card")).toHaveCount(1);
			await expect(openApiBlock).toContainText("Get a post");
			await expect(openApiBlock).not.toContainText("List posts");
			await expect(openApiBlock.locator(".search-count")).toHaveText("1 of 2");

			await openApiBlock.locator(".search-clear").click();
			await expect(openApiBlock.locator(".op-card")).toHaveCount(2);
			await expect(openApiBlock.locator(".search-count")).toHaveText("2");

			await searchInput.fill("Get a post");
			await expect(openApiBlock.locator(".op-card")).toHaveCount(1);

			await sharedPage.getByTestId("table-of-contents").getByText("List posts").click();

			await expect(openApiBlock.locator(".op-card")).toHaveCount(2);
			await expect(openApiBlock).toContainText("List posts");
			await expect(searchInput).toHaveValue("");
		},
	);

	editorTest(
		"RU interface shows a localized search placeholder and empty state",
		async ({ editor, basePage, sharedPage }) => {
			await setUiLanguage(sharedPage, basePage, "ru");
			try {
				await editor.focus();

				await editor.clickToolbar("semiBlocks");
				await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

				const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
				await expect(openApiBlock).toBeVisible();

				const searchInput = openApiBlock.locator(".search-input");
				await expect(searchInput).toHaveAttribute("placeholder", "Поиск по операциям...");

				await searchInput.fill("zzznotfound");
				await expect(openApiBlock.getByText("Ничего не найдено")).toBeVisible();
			} finally {
				// The language lives in localStorage, which outlives the test: without restoring it here a
				// failing assertion would leave every later test in this worker running a Russian UI.
				await setUiLanguage(sharedPage, basePage, "en");
			}
		},
	);
});

// `editorTest.use()` is file-scoped no matter where or how many times it's called or which describe
// wraps it -- worker-scoped options (like the `files` tree) resolve to whichever `use()` call is LAST
// in the file, for every test in the file, including ones declared before it. So this is deliberately
// the file's ONLY `.use()` call, with every scenario below sharing one merged file tree (each its own
// pre-planted article, visited by link) instead of one article edited per scenario. Read-only-mode
// scenarios can't share this file at all (isReadOnly is its own worker-scoped option with the same
// last-wins-for-the-whole-file behavior), so read-only coverage belongs in the docportal suite, which runs
// with a reader project of its own.
//
// The tree is a set of article + spec pairs, one per scenario: the article is a one-line `<openapi src=…/>`,
// the spec next to it is broken in exactly one way, and that one way is what its scenario asserts on. Nothing
// here is a general-purpose spec — read each pair as "the smallest document that reproduces this failure".
// The specs are deliberately near-identical (one operation, one 200 response), so a diff between two of them
// shows the whole point of the pair.
editorTest.use({
	files: {
		editor: {
			// Catalog config. Redeclaring `files` replaces the shared editor fixture's tree wholesale, so
			// without this entry the catalog has none; `syntax: xml` is what makes an OpenAPI block read as
			// `<openapi src="…"/>` in the article source instead of a fenced block.
			"doc-root.yml": md`
				syntax: xml
			`,

			// startUrl article, read as-is by "OpenApi external refs" (the first describe wipes it, see above).
			// api.yaml resolves a $ref into a second file; `externalRefMarker` from that file is the string the
			// scenario looks for, so it fails if the ref is silently dropped instead of followed.
			"untitled.md": '<openapi src="api.yaml"/>',
			"api.yaml": md`
				openapi: "3.0.0"
				info:
				  title: Multi-file API
				  version: 1.0.0
				paths:
				  /items:
				    get:
				      operationId: listItems
				      summary: List items
				      responses:
				        "200":
				          description: OK
				          content:
				            application/json:
				              schema:
				                $ref: "./schemas/common.yaml#/Item"
			`,

			// Same spec, except the $ref points at a file that does not exist. The operation must still render
			// — the diagnostic is about one unresolved ref, not about the document being unusable.
			"broken.md": '<openapi src="broken-api.yaml"/>',
			"broken-api.yaml": md`
				openapi: "3.0.0"
				info:
				  title: Broken ref API
				  version: 1.0.0
				paths:
				  /items:
				    get:
				      operationId: listItems
				      summary: List items
				      responses:
				        "200":
				          description: OK
				          content:
				            application/json:
				              schema:
				                $ref: "./schemas/missing.yaml#/Nope"
			`,

			// `schema: {}` is a placeholder the preview scenario replaces through Monaco with a $ref to
			// schemas/extra.yaml — and never saves. It has to be an empty object literal on its own line,
			// because the edit is typed as a single-line replacement.
			"preview.md": '<openapi src="preview-api.yaml"/>',
			"preview-api.yaml": md`
				openapi: "3.0.0"
				info:
				  title: Preview API
				  version: 1.0.0
				paths:
				  /items:
				    get:
				      operationId: listItems
				      summary: List items
				      responses:
				        "200":
				          description: OK
				          content:
				            application/json:
				              schema: {}
			`,

			// U1: the article points at missing.yaml and the tree deliberately has no such file.
			"missing-spec.md": '<openapi src="missing.yaml"/>',

			// U2: the file exists and is empty — a different message from "not found", which is the point.
			"empty-spec.md": '<openapi src="empty.yaml"/>',
			"empty.yaml": "",

			// U3: valid YAML that parses to the string "hello", not to an object. Distinguishes "this is not a
			// spec" from "this is broken YAML" (U2/syntax) — the parser succeeds here, the shape is wrong.
			"not-a-spec.md": '<openapi src="not-a-spec.yaml"/>',
			"not-a-spec.yaml": "hello",

			// U4: one operation renders, `/broken` has no `responses` and is skipped with a diagnostic. Both
			// halves matter — the document must stay readable while the panel names what was dropped.
			"partial-spec.md": '<openapi src="partial.yaml"/>',
			"partial.yaml": md`
				openapi: "3.0.0"
				info:
				  title: Partial API
				  version: 1.0.0
				paths:
				  /items:
				    get:
				      operationId: listItems
				      summary: List items
				      responses:
				        "200":
				          description: OK
				  /broken:
				    get:
				      summary: Broken operation
			`,

			// Valid spec whose first line is `openapi: "3.0.0"`: the syntax scenario breaks it by deleting that
			// closing quote in Monaco, so the first line has to be exactly that and stay unquoted-breakable.
			"preview-syntax.md": '<openapi src="preview-syntax.yaml"/>',
			"preview-syntax.yaml": md`
				openapi: "3.0.0"
				info:
				  title: Preview syntax API
				  version: 1.0.0
				paths:
				  /items:
				    get:
				      operationId: listItems
				      summary: List items
				      responses:
				        "200":
				          description: OK
			`,

			// Try it out. The servers are deliberately relative (`/mock-api/...`): the request then leaves for the
			// app's own origin, so Playwright's route intercepts it with no CORS preflight in the way — an absolute
			// host would make every scenario below a test of the browser's CORS rules instead of the block's.
			// `petId` is required and `security` is declared per-operation, which is what the empty-field and
			// Authorization-header scenarios need; the second server exists so selecting it changes the sent URL.
			"try-it-out.md": '<openapi src="try-api.yaml"/>',
			"try-api.yaml": md`
				openapi: "3.0.0"
				info:
				  title: Try API
				  version: 1.0.0
				servers:
				  - url: /mock-api/v1
				    description: Primary
				  - url: /mock-api/v2
				    description: Secondary
				components:
				  securitySchemes:
				    bearerAuth:
				      type: http
				      scheme: bearer
				paths:
				  /pets/{petId}:
				    post:
				      operationId: addPet
				      summary: Add a pet
				      security:
				        - bearerAuth: []
				      parameters:
				        - name: petId
				          in: path
				          required: true
				          schema:
				            type: string
				      responses:
				        "200":
				          description: OK
			`,

			// The path order deliberately disagrees with the declared tag order. The viewer and the article TOC
			// must both follow `tags` first, then append an undeclared tag at its first encounter. Four operations
			// per group also make the article tall enough to exercise the real scroll container and its bottom edge.
			"toc-order.md": '<openapi src="toc-order.yaml"/>',
			"toc-order.yaml": md`
				openapi: "3.0.0"
				info:
				  title: TOC order API
				  version: 1.0.0
				tags:
				  - name: Zebra
				  - name: Alpha
				paths:
				  /alpha-1:
				    get:
				      operationId: alpha1
				      summary: Alpha operation 1
				      tags: [Alpha]
				      responses:
				        "200": { description: OK }
				  /alpha-2:
				    get:
				      operationId: alpha2
				      summary: Alpha operation 2
				      tags: [Alpha]
				      responses:
				        "200": { description: OK }
				  /alpha-3:
				    get:
				      operationId: alpha3
				      summary: Alpha operation 3
				      tags: [Alpha]
				      responses:
				        "200": { description: OK }
				  /alpha-4:
				    get:
				      operationId: alpha4
				      summary: Alpha operation 4
				      tags: [Alpha]
				      responses:
				        "200": { description: OK }
				  /discovered-1:
				    get:
				      operationId: discovered1
				      summary: Discovered operation 1
				      tags: [Discovered]
				      responses:
				        "200": { description: OK }
				  /discovered-2:
				    get:
				      operationId: discovered2
				      summary: Discovered operation 2
				      tags: [Discovered]
				      responses:
				        "200": { description: OK }
				  /discovered-3:
				    get:
				      operationId: discovered3
				      summary: Discovered operation 3
				      tags: [Discovered]
				      responses:
				        "200": { description: OK }
				  /discovered-4:
				    get:
				      operationId: discovered4
				      summary: Discovered operation 4
				      tags: [Discovered]
				      responses:
				        "200": { description: OK }
				  /zebra-1:
				    get:
				      operationId: zebra1
				      summary: Zebra operation 1
				      tags: [Zebra]
				      responses:
				        "200": { description: OK }
				  /zebra-2:
				    get:
				      operationId: zebra2
				      summary: Zebra operation 2
				      tags: [Zebra]
				      responses:
				        "200": { description: OK }
				  /zebra-3:
				    get:
				      operationId: zebra3
				      summary: Zebra operation 3
				      tags: [Zebra]
				      responses:
				        "200": { description: OK }
				  /zebra-4:
				    get:
				      operationId: zebra4
				      summary: Zebra operation 4
				      tags: [Zebra]
				      responses:
				        "200": { description: OK }
			`,

			schemas: {
				// Referenced by api.yaml. The property name is the marker: it appears on screen only if the
				// external file was actually read and inlined.
				"common.yaml": md`
					Item:
					  type: object
					  properties:
					    externalRefMarker:
					      type: string
					      description: from-external-file-marker
				`,
				// Referenced by nothing on disk — the preview scenario types the $ref to it into Monaco and
				// never saves, so its marker proves the unsaved preview resolves refs against the file tree.
				"extra.yaml": md`
					Extra:
					  type: object
					  properties:
					    addedViaEditorMarker:
					      type: string
					      description: added-through-monaco-before-save
				`,
			},
		},
	},
});

const openTocOrderArticle = async (sharedPage: Page, basePage: { waitForLoad: () => Promise<unknown> }) => {
	await sharedPage.getByRole("link", { name: "toc-order", exact: true }).first().click();
	await basePage.waitForLoad();
	const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
	await expect(openApiBlock).toContainText("TOC order API");
	return openApiBlock;
};

editorTest.describe("OpenAPI table of contents", () => {
	editorTest("Viewer and TOC follow declared tag order before discovered tags", async ({ basePage, sharedPage }) => {
		const openApiBlock = await openTocOrderArticle(sharedPage, basePage);
		const toc = sharedPage.getByTestId("table-of-contents");

		await expect(openApiBlock.locator(".section-name")).toHaveText(["Zebra", "Alpha", "Discovered"]);
		await expect(toc.getByRole("link")).toHaveText([
			"Zebra",
			"Zebra operation 1",
			"Zebra operation 2",
			"Zebra operation 3",
			"Zebra operation 4",
			"Alpha",
			"Alpha operation 1",
			"Alpha operation 2",
			"Alpha operation 3",
			"Alpha operation 4",
			"Discovered",
			"Discovered operation 1",
			"Discovered operation 2",
			"Discovered operation 3",
			"Discovered operation 4",
		]);
	});

	editorTest(
		"Scroll highlights the topmost operation and the final item at the document end",
		async ({ basePage, sharedPage }) => {
			await openTocOrderArticle(sharedPage, basePage);
			const toc = sharedPage.getByTestId("table-of-contents");
			const articleScroll = sharedPage.getByTestId("article-scroll-container");
			const middleLink = toc.getByRole("link", { name: "Alpha operation 3", exact: true });
			const href = await middleLink.getAttribute("href");
			if (!href?.includes("#")) throw new Error("The TOC link has no fragment anchor");

			await articleScroll.evaluate(
				(element, anchorId) => {
					const target = document.getElementById(anchorId);
					if (!target) throw new Error(`The article has no target #${anchorId}`);
					element.scrollTo({ top: target.offsetTop - 40, behavior: "auto" });
				},
				href.slice(href.indexOf("#") + 1),
			);

			await expect(middleLink).toHaveClass(/\bactive\b/);
			await expect(toc.locator("a.active")).toHaveCount(1);

			await articleScroll.evaluate((element) =>
				element.scrollTo({ top: element.scrollHeight, behavior: "auto" }),
			);
			const finalLink = toc.getByRole("link", { name: "Discovered operation 4", exact: true });
			await expect(finalLink).toHaveClass(/\bactive\b/);
			await expect(toc.locator("a.active")).toHaveCount(1);
		},
	);
});

editorTest.describe("OpenApi external refs", () => {
	editorTest("Renders combined docs from external files with no external-ref diagnostic", async ({ sharedPage }) => {
		const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
		await expect(openApiBlock).toBeVisible();
		await expect(openApiBlock).toContainText("List items");

		const firstOperation = openApiBlock.locator(".op-card").first();
		await firstOperation.locator(".op-head").click();
		await expect(firstOperation).toContainText("externalRefMarker");
		// The panel now renders localized templates keyed by diagnostic code, so an unresolved $ref reads
		// "$ref could not be resolved" instead of the core's raw English message.
		await expect(openApiBlock).not.toContainText("$ref could not be resolved");
	});

	editorTest(
		"Shows a diagnostic for an unresolvable ref while the rest still renders",
		async ({ basePage, sharedPage }) => {
			await sharedPage.getByRole("link", { name: "broken", exact: true }).click();
			await basePage.waitForLoad();

			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			await expect(openApiBlock).toBeVisible();
			await expect(openApiBlock).toContainText("List items");
			await expect(openApiBlock).toContainText("$ref could not be resolved");
		},
	);

	editorTest(
		"Preview resolves an external ref added in the editor before saving",
		async ({ basePage, sharedPage }) => {
			// first(): the left tree comes before the article body in the DOM, and the body carries its own
			// prev/next jump link with the same accessible name, which would make a bare locator ambiguous.
			await sharedPage.getByRole("link", { name: "preview", exact: true }).first().click();
			await basePage.waitForLoad();

			const openApiNode = sharedPage.locator(".node-openapi");
			await expect(openApiNode).toBeVisible();
			await openApiNode.hover();

			const nodeActions = openApiNode.locator('[data-qa="qa-node-actions"]');
			await nodeActions.getByTestId("edit-diagram").click();
			await expect(basePage.modal).toBeVisible();
			await waitForMonaco(basePage.modal);

			const monacoEditor = basePage.modal.locator('.monaco-editor[role="code"]');
			const monacoTextarea = basePage.modal.locator(".inputarea.monaco-mouse-cursor-text");
			await monacoEditor.getByText("schema: {}", { exact: true }).click();
			await monacoTextarea.press("End");
			await monacoTextarea.press("Backspace");
			await monacoTextarea.press("Backspace");
			await monacoTextarea.pressSequentially('{"$ref": "./schemas/extra.yaml#/Extra"}');

			const preview = basePage.modal.locator('[data-testid="open-api-viewer"]');
			const previewOperation = preview.locator(".op-card").first();
			await previewOperation.locator(".op-head").click();
			await expect(previewOperation).toContainText("addedViaEditorMarker");

			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			await expect(openApiBlock).not.toContainText("addedViaEditorMarker");
		},
	);
});

// The API the block talks to is a Playwright route, never a real host: every scenario states what the server
// answers, and the recorded calls are what proves the request actually left with the right URL and headers.
const MOCK_API = "**/mock-api/**";

type MockedCall = { url: string; method: string; headers: Record<string, string> };

// sharedPage is worker-scoped, so a route left registered would answer for every later test in this file --
// each scenario unroutes in a finally.
const mockApi = async (page: Page, respond: (route: Route) => Promise<void>): Promise<MockedCall[]> => {
	const calls: MockedCall[] = [];
	await page.route(MOCK_API, async (route) => {
		const request = route.request();
		calls.push({ url: request.url(), method: request.method(), headers: await request.allHeaders() });
		await respond(route);
	});
	return calls;
};

const respondOk = (route: Route) =>
	route.fulfill({
		status: 200,
		contentType: "application/json",
		body: JSON.stringify({ id: "42", name: "Rex" }),
	});

const openTryOperation = async (sharedPage: Page, basePage: { waitForLoad: () => Promise<unknown> }) => {
	await sharedPage.getByRole("link", { name: "try-it-out", exact: true }).first().click();
	await basePage.waitForLoad();

	const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
	// The block mounts before its spec arrives, and the skeleton flipping to loaded remounts the viewer --
	// clicking in that window opens an element that is then replaced by a fresh, closed one. Waiting for
	// text out of the spec itself means the operation clicked below is the one that stays.
	await expect(openApiBlock).toContainText("Add a pet");

	const operation = openApiBlock.locator(".op-card").first();
	// Disclosure state is exposed by the button. The body stays mounted while CSS variables collapse it, so
	// visibility alone cannot tell whether its controls are actually reachable by pointer.
	const head = operation.locator(".op-head");
	if ((await head.getAttribute("aria-expanded")) !== "true") await head.click();
	await expect(head).toHaveAttribute("aria-expanded", "true");
	return { openApiBlock, operation };
};

editorTest.describe("OpenApi Try it out", () => {
	editorTest("Try it mode sends the request and shows the response", async ({ basePage, sharedPage }) => {
		const calls = await mockApi(sharedPage, respondOk);
		try {
			const { operation } = await openTryOperation(sharedPage, basePage);

			// EN half of the wording criterion; the RU half is its own scenario below.
			await expect(operation.locator('[data-mode="desc"]')).toHaveText("Overview");
			await expect(operation.locator('[data-mode="exec"]')).toContainText("Try it");

			await operation.locator('[data-mode="exec"]').click();
			await expect(operation.locator("[data-run]")).toContainText("Send");
			await operation.locator('[data-param="petId"]').fill("42");
			await operation.locator("[data-run]").click();

			await expect(operation.locator(".try-result")).toBeVisible();
			await expect(operation).toContainText("200 OK");
			await expect(operation.locator(".try-result")).toContainText(/"name":\s*"Rex"/);

			expect(calls).toHaveLength(1);
			expect(calls[0].method).toBe("POST");
			expect(new URL(calls[0].url).pathname).toBe("/mock-api/v1/pets/42");
		} finally {
			await sharedPage.unroute(MOCK_API);
		}
	});

	editorTest(
		"Response puts body first, request URL last, and Clear beside Send",
		async ({ basePage, sharedPage }) => {
			await mockApi(sharedPage, respondOk);
			try {
				const { operation } = await openTryOperation(sharedPage, basePage);

				await operation.locator('[data-mode="exec"]').click();
				await operation.locator('[data-param="petId"]').fill("42");
				await operation.locator("[data-run]").click();
				await expect(operation.locator(".try-result")).toBeVisible();

				const geometry = await operation.evaluate((root) => {
					const rect = (selector: string) => {
						const node = root.querySelector<HTMLElement>(selector);
						if (!node) throw new Error(`Missing alignment target: ${selector}`);
						const box = node.getBoundingClientRect();
						return { x: box.x, y: box.y, width: box.width, height: box.height };
					};
					return {
						result: rect(".try-result"),
						head: rect(".result-head"),
						heading: rect(".result-head .subhead"),
						status: rect(".result-head .status"),
						body: rect(".result-body"),
						headers: rect(".result-headers"),
						url: rect(".result-url"),
						actions: rect(".exec-actions"),
						clear: rect(".clear-result"),
						send: rect("[data-run]"),
						urlLabel: rect(".result-url .result-label"),
						urlValue: rect(".result-url .code-block"),
						urlWrap: rect(".result-url .example-wrap"),
						urlCopy: rect(".result-url .copy"),
						bodyLabel: rect(".result-body .result-label"),
						bodyValue: rect(".result-body .code-block"),
						bodyWrap: rect(".result-body .example-wrap"),
						bodyCopy: rect(".result-body .copy"),
					};
				});
				const centerY = (box: { y: number; height: number }) => box.y + box.height / 2;

				expect(Math.abs(centerY(geometry.heading) - centerY(geometry.status))).toBeLessThanOrEqual(1);
				expect(geometry.body.y).toBeGreaterThanOrEqual(geometry.head.y + geometry.head.height);
				expect(geometry.headers.y).toBeGreaterThanOrEqual(geometry.body.y + geometry.body.height);
				expect(geometry.url.y).toBeGreaterThanOrEqual(geometry.headers.y + geometry.headers.height);
				expect(geometry.actions.y + geometry.actions.height).toBeLessThanOrEqual(geometry.head.y);
				expect(Math.abs(centerY(geometry.clear) - centerY(geometry.send))).toBeLessThanOrEqual(1);
				expect(geometry.clear.x + geometry.clear.width).toBeLessThanOrEqual(geometry.send.x);
				expect(Math.abs(geometry.urlLabel.x - geometry.bodyLabel.x)).toBeLessThanOrEqual(1);
				// Chromium on Linux rounds the label's font metrics one pixel wider than macOS. The values still
				// share the same visual column; allow that two-pixel cross-platform rounding without weakening
				// the ordering or edge-alignment checks around it.
				expect(Math.abs(geometry.urlValue.x - geometry.bodyValue.x)).toBeLessThanOrEqual(2);
				expect(Math.abs(geometry.urlWrap.x - geometry.bodyWrap.x)).toBeLessThanOrEqual(1);
				expect(
					Math.abs(
						geometry.urlWrap.x + geometry.urlWrap.width - geometry.bodyWrap.x - geometry.bodyWrap.width,
					),
				).toBeLessThanOrEqual(1);
				expect(geometry.urlCopy.width).toBe(geometry.bodyCopy.width);
				expect(geometry.urlCopy.height).toBe(geometry.bodyCopy.height);
				const urlCopyInset =
					geometry.urlWrap.x + geometry.urlWrap.width - geometry.urlCopy.x - geometry.urlCopy.width;
				const bodyCopyInset =
					geometry.bodyWrap.x + geometry.bodyWrap.width - geometry.bodyCopy.x - geometry.bodyCopy.width;
				expect(urlCopyInset).toBeLessThan(bodyCopyInset);
			} finally {
				await sharedPage.unroute(MOCK_API);
			}
		},
	);

	editorTest(
		"The entered token leaves as an Authorization header and stays masked on screen",
		async ({ basePage, sharedPage }) => {
			const token = "e2e-secret-token";
			const calls = await mockApi(sharedPage, respondOk);
			try {
				const { openApiBlock, operation } = await openTryOperation(sharedPage, basePage);

				await openApiBlock
					.locator(".doc-header")
					.getByRole("button", { name: "Authorize", exact: true })
					.press("Enter");
				const authDialog = openApiBlock.locator(".auth-dialog");
				await expect(authDialog).toBeVisible();
				await authDialog.locator('[data-auth-scheme="bearerAuth"][data-auth-field="token"]').fill(token);
				await authDialog.getByRole("button", { name: "Save" }).click();
				await expect(authDialog).toHaveCount(0);

				await operation.locator('[data-mode="exec"]').click();
				await operation.locator('[data-param="petId"]').fill("42");

				// The curl preview is where the reader would see the token if it were ever printed in full.
				await expect(operation.locator("[data-curl]")).toContainText("Authorization");
				await expect(operation.locator("[data-curl]")).not.toContainText(token);

				await operation.locator("[data-run]").click();
				await expect(operation).toContainText("200 OK");

				expect(calls).toHaveLength(1);
				expect(calls[0].headers.authorization).toBe(`Bearer ${token}`);
				await expect(operation.locator(".try-result")).not.toContainText(token);
			} finally {
				await sharedPage.unroute(MOCK_API);
			}
		},
	);

	editorTest(
		"RU interface labels the mode and explains a failed request in Russian",
		async ({ basePage, sharedPage }) => {
			await mockApi(sharedPage, (route) => route.abort("failed"));
			try {
				await setUiLanguage(sharedPage, basePage, "ru");
				const { operation } = await openTryOperation(sharedPage, basePage);

				await expect(operation.locator('[data-mode="desc"]')).toHaveText("Обзор");
				await expect(operation.locator('[data-mode="exec"]')).toContainText("Попробовать");

				await operation.locator('[data-mode="exec"]').click();
				await expect(operation.locator("[data-run]")).toContainText("Отправить");
				await operation.locator('[data-param="petId"]').fill("42");
				await operation.locator("[data-run]").click();

				await expect(operation.locator(".result-error")).toContainText("Не удалось получить ответ");
				await expect(operation.locator(".result-error")).toContainText(
					"API недоступен или запрос был заблокирован. Проверьте URL сервера или попробуйте команду curl выше.",
				);
				await expect(operation.locator(".try-result")).toContainText("/mock-api/v1/pets/42");
			} finally {
				// The language lives in localStorage, which outlives the test: without restoring it here a failing
				// assertion would leave every later test in this worker running a Russian UI.
				await setUiLanguage(sharedPage, basePage, "en");
				await sharedPage.unroute(MOCK_API);
			}
		},
	);
});

// The PDF export never prints the article you are looking at: `ArticleViewContainer` wraps it in
// `print:hidden`, and the exporter builds its own paginated copy where every block is mounted afresh, in
// Overview. So the reader's token and request result cannot reach paper even while they are still on screen,
// and that is what this checks. Driving the whole export here instead was tried and rejected: it paginates
// every article in the catalog, each remounted block refetches its spec, and what has finished rendering by
// the time the exporter reports "done" differs from run to run. The full path was verified once by hand
// against a real PDF (pdftotext over `page.pdf()` after `window.gramaxPrintCatalog`): the documentation is
// there, the token, the send button, the result body and the request URL are not -- see the US.
editorTest.describe("OpenApi print media", () => {
	editorTest(
		"The article body is kept off paper while it still holds the Try it state",
		async ({ basePage, sharedPage }) => {
			await mockApi(sharedPage, respondOk);
			try {
				const { openApiBlock, operation } = await openTryOperation(sharedPage, basePage);

				await operation.locator('[data-mode="exec"]').click();
				await operation.locator('[data-param="petId"]').fill("42");
				await operation.locator("[data-run]").click();
				await expect(operation).toContainText("200 OK");

				await sharedPage.emulateMedia({ media: "print" });
				await expect(openApiBlock).toBeHidden();

				await sharedPage.emulateMedia({ media: null });
				await expect(operation.locator('[data-param="petId"]')).toHaveValue("42");
			} finally {
				await sharedPage.emulateMedia({ media: null });
				await sharedPage.unroute(MOCK_API);
			}
		},
	);
});

editorTest.describe("OpenApi U1-U4 error classification", () => {
	editorTest("Missing spec file names the path instead of blaming the reader", async ({ basePage, sharedPage }) => {
		await sharedPage.getByRole("link", { name: "missing-spec", exact: true }).click();
		await basePage.waitForLoad();

		const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
		await expect(openApiBlock).toBeVisible();
		await expect(openApiBlock).toContainText("Failed to display the OpenAPI specification");
		await expect(openApiBlock).toContainText("missing.yaml");
		await expect(openApiBlock).toContainText("was not found");
	});

	editorTest("Empty spec file reports the file as empty, not missing", async ({ basePage, sharedPage }) => {
		await sharedPage.getByRole("link", { name: "empty-spec", exact: true }).click();
		await basePage.waitForLoad();

		const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
		await expect(openApiBlock).toContainText("empty.yaml");
		await expect(openApiBlock).toContainText("is empty");
	});

	editorTest(
		"Non-object spec content reports a structure mismatch, not a core error shell",
		async ({ basePage, sharedPage }) => {
			await sharedPage.getByRole("link", { name: "not-a-spec", exact: true }).click();
			await basePage.waitForLoad();

			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			await expect(openApiBlock).toContainText("does not look like an OpenAPI specification");
		},
	);

	editorTest(
		"One broken operation among several keeps the doc rendered with a diagnostics panel while editing",
		async ({ basePage, sharedPage }) => {
			await sharedPage.getByRole("link", { name: "partial-spec", exact: true }).click();
			await basePage.waitForLoad();

			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			await expect(openApiBlock).toContainText("List items");
			await expect(openApiBlock.locator(".diagnostics-panel")).toBeVisible();
			await expect(openApiBlock.locator(".diagnostics-panel")).toContainText("broken");
			await expect(openApiBlock.locator(".diagnostics-panel")).toContainText("responses");
		},
	);

	editorTest(
		"Spec editor preview reports broken YAML with the same line and column as the article",
		async ({ basePage, sharedPage }) => {
			await sharedPage.getByRole("link", { name: "preview-syntax", exact: true }).click();
			await basePage.waitForLoad();

			const openApiNode = sharedPage.locator(".node-openapi");
			await expect(openApiNode).toBeVisible();
			await openApiNode.hover();
			await openApiNode.locator('[data-qa="qa-node-actions"]').getByTestId("edit-diagram").click();
			await expect(basePage.modal).toBeVisible();
			await waitForMonaco(basePage.modal);

			// Same single-line break as the article-level syntax test: drop the closing quote of the first
			// line. The preview must classify it while typing, before anything is saved (criterion 7).
			const monacoEditor = basePage.modal.locator('.monaco-editor[role="code"]');
			const monacoTextarea = basePage.modal.locator(".inputarea.monaco-mouse-cursor-text");
			await monacoEditor.getByText('openapi: "3.0.0"', { exact: true }).click();
			await monacoTextarea.press("End");
			await monacoTextarea.press("Backspace");

			await expect(basePage.modal).toContainText("Failed to display the OpenAPI specification");
			await basePage.modal.getByText("Details", { exact: true }).click();
			await expect(basePage.modal).toContainText(/YAML syntax error: line \d+, column \d+/);
			const previewMessage =
				(await basePage.modal.innerText()).match(/YAML syntax error: line \d+, column \d+/)?.[0] ?? "";
			expect(previewMessage).toMatch(/line \d+, column \d+/);

			// The article must report the very same thing, not a different text for the same break.
			await basePage.modal.getByRole("button", { name: "Save" }).click();
			await expect(basePage.modal).not.toBeVisible();

			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			await expect(openApiBlock).toContainText("Failed to display the OpenAPI specification");
			await openApiBlock.getByText("Details", { exact: true }).click();
			await expect(openApiBlock).toContainText(previewMessage);
		},
	);

	editorTest("RU interface shows a localized missing-file message", async ({ basePage, sharedPage }) => {
		await sharedPage.getByRole("link", { name: "missing-spec", exact: true }).click();
		await basePage.waitForLoad();
		await setUiLanguage(sharedPage, basePage, "ru");
		try {
			const openApiBlock = sharedPage.locator('[data-testid="open-api"]');
			await expect(openApiBlock).toContainText("Не удалось отобразить OpenAPI-спецификацию");
			await expect(openApiBlock).toContainText("не найден");
		} finally {
			await setUiLanguage(sharedPage, basePage, "en");
		}
	});
});
