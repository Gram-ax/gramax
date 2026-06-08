export function downloadJson(json: unknown, fileName: string) {
	const fileContent = JSON.stringify(json, null, 4);
	downloadTextFile(fileContent, fileName);
}

export function downloadTextFile(text: string, fileName: string) {
	const fileContent = text;
	const element = document.createElement("a");
	element.setAttribute("href", `data:text/plain;charset=utf-8, ${encodeURIComponent(fileContent)}`);
	element.setAttribute("download", fileName);
	element.style.display = "none";
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}
