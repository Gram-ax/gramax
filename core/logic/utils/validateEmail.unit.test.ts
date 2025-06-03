import validateEmail from "./validateEmail";

describe("validateEmail", () => {
	test("should return true for valid email addresses", () => {
		expect(validateEmail("test@example.com")).toBeTruthy();
		expect(validateEmail("test.name@example.com")).toBeTruthy();
		expect(validateEmail("test+alias@example.com")).toBeTruthy();
		expect(validateEmail("test@sub.example.com")).toBeTruthy();
		expect(validateEmail("test@example.co.uk")).toBeTruthy();
		expect(validateEmail("test_underscore@example.com")).toBeTruthy();
		expect(validateEmail("12345@example.com")).toBeTruthy();
	});

	test("should return false for invalid email addresses", () => {
		expect(validateEmail("plainaddress")).toBeFalsy();
		expect(validateEmail("@missingusername.com")).toBeFalsy();
		expect(validateEmail("username@.com")).toBeFalsy();
		expect(validateEmail("username@com")).toBeFalsy();
		expect(validateEmail("username@.com.")).toBeFalsy();
		expect(validateEmail("username@com.")).toBeFalsy();
		expect(validateEmail("username @ example.com")).toBeFalsy();
		expect(validateEmail("username@example..com")).toBeFalsy();
		expect(validateEmail("username@example,com")).toBeFalsy();
		expect(validateEmail("username@example com")).toBeFalsy();
		expect(validateEmail("")).toBeFalsy();
		expect(validateEmail(null)).toBeFalsy();
		expect(validateEmail(undefined)).toBeFalsy();
		expect(validateEmail(123)).toBeFalsy();
		expect(validateEmail({})).toBeFalsy();
	});
});
