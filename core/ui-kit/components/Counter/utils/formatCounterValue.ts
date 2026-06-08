/**
 * Formats a number for display in the Counter component according to the following rules:
 * - Maximum 4 characters, including `+`
 * - 0 is not displayed
 * - No fractions
 *
 * @param value - Number to format
 * @returns Formatted string or empty string for 0
 *
 * @example
 * formatCounterValue(5) // "5"
 * formatCounterValue(42) // "42"
 * formatCounterValue(150) // "99+"
 * formatCounterValue(5000) // "999+"
 * formatCounterValue(50000) // "10k+"
 * formatCounterValue(2000000) // "2М+"
 * formatCounterValue(10000000) // "10М+"
 * formatCounterValue(99000000) // "99М+"
 * formatCounterValue(0) // ""
 */
export function formatCounterValue(value: number): string {
	// 0 is not displayed
	if (value === 0) {
		return "";
	}

	// Negative numbers are not supported
	if (value < 0) {
		return "";
	}

	// 1-9: display one digit
	if (value >= 1 && value <= 9) {
		return String(value);
	}

	// 10-99: display two digits
	if (value >= 10 && value <= 99) {
		return String(value);
	}

	// 100-999: display "99+"
	if (value >= 100 && value <= 999) {
		return "99+";
	}

	// 1 000-9 999: display "999+"
	if (value >= 1000 && value <= 9999) {
		return "999+";
	}

	// 10 000-999 999: display "10k+", "99k+" and so on
	if (value >= 10000 && value <= 999999) {
		const thousands = Math.floor(value / 1000);
		// Check that the result does not exceed 4 characters
		if (thousands <= 99) {
			return `${thousands}k+`;
		}
		// If more than 99k, display 99k+
		return "99k+";
	}

	// ≥ 1 000 000: display "1М+", "9М+", "10М+", "99М+" and so on
	if (value >= 1000000) {
		const millions = Math.floor(value / 1000000);
		// 1-9 million and 10-98 million"
		if ((millions >= 1 && millions <= 9) || (millions >= 10 && millions <= 98)) {
			return `${millions}М+`;
		}
		// 99 million and above: always "99М+"
		return "99М+";
	}

	// Fallback (should not happen)
	return String(value);
}
