const getFirstPatentByName = (element: HTMLElement, name: string) => {
	let find: HTMLElement = element;
	do {
		find = find.parentElement;
	} while (find && find.nodeName.toUpperCase() !== name.toUpperCase() && find.nodeName !== "BODY");
	return find;
};

export default getFirstPatentByName;
