export default function isURL(str: string): boolean {
	try {
		new URL(str);
		return true;
	} catch {
		return false;
	}
}
