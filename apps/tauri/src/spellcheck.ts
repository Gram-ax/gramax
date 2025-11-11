import { invoke } from "@tauri-apps/api/core";

const isSpellcheckEnabled = () => {
	const elem = document.getElementById("custom-style");
	return elem ? elem.getAttribute("spellcheck") === "true" : false;
};

const applySpellcheck = (enabled: boolean) => {
	const elem = document.getElementById("custom-style");
	if (!elem) return;
	elem.setAttribute("spellcheck", enabled ? "true" : "false");
	void invoke("set_menuitem_spellcheck_enabled", { newEnabled: enabled });
};

const isSpellcheckShouldBeEnabled = () => {
	const val = window.localStorage.getItem("spellcheck-disabled");
	return !val || val !== "1";
};

const initSpellcheck = () => {
	const shouldBeEnabled = isSpellcheckShouldBeEnabled();
	applySpellcheck(shouldBeEnabled);
};

const toggleSpellcheck = () => {
	const enabled = isSpellcheckEnabled();
	const newEnabled = !enabled;

	window.localStorage.setItem("spellcheck-disabled", newEnabled ? "0" : "1");

	applySpellcheck(newEnabled);
};

export { initSpellcheck, toggleSpellcheck };
