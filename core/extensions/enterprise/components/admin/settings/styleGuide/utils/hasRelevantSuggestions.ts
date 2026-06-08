export function hasRelevantSuggestions(ruleName: string, text: string): boolean {
	const escapedRuleName = ruleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	const nameRegex = new RegExp(`name\\d*=['"'"]${escapedRuleName}['"'"]`, "g"); //sometimes responses come with different types of quotes

	return nameRegex.test(text);
}
