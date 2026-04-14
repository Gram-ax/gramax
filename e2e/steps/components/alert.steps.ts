import { When } from "@cucumber/cucumber";
import type E2EWorld from "../../models/World";

When("нажимаю на ОК в алёрте", function (this: E2EWorld) {
	return page.on("dialog", async (dialog) => {
		await dialog.accept();
	});
});
