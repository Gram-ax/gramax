export default function ChangeContext(context) {
	document.documentElement.className = `theme-${context.theme}`;
	document.documentElement.lang = context.lang;
}
