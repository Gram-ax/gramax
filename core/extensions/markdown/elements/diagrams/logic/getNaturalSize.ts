const getNaturalSize = (data: string) => {
	const div = document.createElement("div");
	div.innerHTML = data;
	div.style.maxWidth = "780px";
	div.style.width = "100%";

	const svg = div.firstElementChild as HTMLElement;
	document.body.appendChild(div);

	const width = svg?.clientWidth || 0;
	const height = svg?.clientHeight || 0;

	document.body.removeChild(div);

	return { width, height };
};

export default getNaturalSize;
