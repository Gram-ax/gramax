# BDD Principle Violations Analysis for E2E Tests

## BDD Principles Summary
- **Given** steps should only describe initial state/setup, not perform actions
- **When** steps should describe actions being performed
- **Then** steps should only verify/assert results, not perform actions

## Violations Found

### 1. core.steps.ts

#### Then performing action (line 55-57)
```typescript
Then("заново смотрим на/в {string}", async function (this: E2EWorld, selector: string) {
    await lookAt.bind(this)(selector, true); // Performing focus action
});
```
**Should be:** `When("заново смотрим на/в {string}"...)`
**Reason:** This step performs a focus action and resets search scope, which is an action, not a verification.

#### Then performing action (line 91-93)
```typescript
Then("нажимаем на {int} кнопку с текстом {string}", async function (this: E2EWorld, i: number, text: string) {
    await this.page().search().clickable(text, undefined, true).nth(i).click(); // Clicking
});
```
**Should be:** `When("нажимаем на {int} кнопку с текстом {string}"...)`
**Reason:** This step performs a click action, which should be a When step, not a Then step.

#### Then performing action (line 249-251)
```typescript
Then("перезагружаем страницу", async function (this: E2EWorld) {
    await this.page().inner().reload(); // Reloading page
});
```
**Should be:** `When("перезагружаем страницу"...)`
**Reason:** Page reload is an action that changes state, not a verification.

### 2. modal.steps.ts

#### Then performing action (line 28-34)
```typescript
Then("заполняем форму", async function (this: E2EWorld, raw: string) {
    // Filling form fields - this is an action
    for (const [name, val] of raw.split("\n").map((raw) => raw.split(": ", 2).map((s) => s.trim()))) {
        const field = await search.lookup(name, undefined, true);
        await field.fill(this.replace(val) ?? val);
    }
});
```
**Should be:** `When("заполняем форму"...)`
**Reason:** Filling form fields is clearly an action that modifies the application state.

### 3. special.steps.ts

#### Given performing action (line 8-30)
```typescript
Given("отменяем все изменения", { timeout: config.timeouts.long }, async function (this: E2EWorld) {
    // Performing multiple clicks and navigation - this is an action sequence
    await search.icon("облачка").click();
    // ... more actions
});
```
**Should be:** `When("отменяем все изменения"...)`
**Reason:** This step performs a complex sequence of actions (clicking, navigation), not just setting up initial state.

#### Then performing action (line 32-36)
```typescript
Then("решаем конфликт", { timeout: config.timeouts.long }, async function (this: E2EWorld) {
    await this.page().keyboard().press("Control+A");
    await this.page().keyboard().type(`---\norder: 1\ntitle: Тест\n---\n\nM\n`);
});
```
**Should be:** `When("решаем конфликт"...)`
**Reason:** This step performs keyboard actions to resolve a conflict, which is an action, not a verification.

#### Then performing action (line 168-177)
```typescript
Then("вставляем текст", async function (this: E2EWorld, text: string) {
    // Copying to clipboard and pasting - this is an action
    await this.page().keyboard().press("Control+V");
});
```
**Should be:** `When("вставляем текст"...)`
**Reason:** This step performs clipboard operations and keyboard actions, not verifications.

#### Then performing action (line 179-192)
```typescript
Then("вставляем изображение", async function (this: E2EWorld) {
    // Taking screenshot and pasting - this is an action
    await this.page().keyboard().press("Control+V");
});
```
**Should be:** `When("вставляем изображение"...)`
**Reason:** This step performs screenshot capture and paste operations, which are actions.

### 4. wysiwyg.steps.ts
No violations found - all steps correctly use When for actions.

### 5. drag.steps.ts
No violations found - all steps correctly use When for drag and drop actions.

## Summary

**Total violations found: 9 steps**

| File | Violations | Types |
|------|------------|-------|
| core.steps.ts | 3 | Then performing actions |
| modal.steps.ts | 1 | Then performing action |
| special.steps.ts | 5 | Given performing action (1), Then performing actions (4) |
| wysiwyg.steps.ts | 0 | None |
| drag.steps.ts | 0 | None |

## Common Patterns
1. **Most common violation:** Using `Then` for actions that should be `When` (8 cases)
2. **Second pattern:** Using `Given` for complex action sequences instead of just setup (1 case)
3. **Action keywords in Russian:** "нажимаем" (clicking), "заполняем" (filling), "вставляем" (pasting), "перезагружаем" (reloading), "решаем" (solving), "отменяем" (canceling) - these action verbs should typically be in When steps

## Recommendations
1. Review all Then steps that contain action verbs and convert them to When steps
2. Ensure Given steps only set up initial state without performing user actions
3. Keep Then steps purely for assertions and verifications
4. Consider creating a linting rule to catch these violations automatically