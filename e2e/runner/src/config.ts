export const config = {
	serverUrl: "https://docs.ics-it.ru/-develop",
	localUrl: "http://localhost:5173/",
	devTools: false,
	slowMo: 0,
	timeout: 5000,
	mediumTimeout: 15000,
	largeTimeout: 30000,
	userCookies: {
		value: "U2FsdGVkX1%2B%2FEkcCYeJc8W%2FIGtu%2B2IaJRF8MX0vMJUHCmXs%2B4V49FelX%2BIamzTcuK9KFWldwEpQHDTw9KUggVwPQU2q10D9VQ1Obzq3QzZFSzIARHPIZy32WjBYGymqil0JZGR192ezrFTWONPPLpc7IsELYlhoongFYC5B8L%2Bd8QUJUoJfWvNuye%2Fe6vI%2FaCL1UE8NGAeohbvfGtjfg%2B7T5dqgGDhR3B%2FefS%2BNPdpSgnkj9h0AFYMAanesDaB8XSckqm2pcwRp1KVEyyOgbehEMqRv2PGfFSSRxcrJDJh70%2BLEJw9jgNfDSDNLfe7rPse9R5nN1ne%2FmR62U68NEPYEgLTHGKcVz6YhThHw6gx22knlgGekIPbZguj3JTGi2OH7f2p4id7lQwxBaUOI4PkKp3oSzWOO1TfBtD20nzOHGyqPhodbOqSG7QYhJf2caGQYp86I1y7sTF97bAtr0M56wDxQO98zk%2BT18fp6BO5DSMf0Fu91m1%2Fctif7Mp3bJ0ZU9jl6vctwoEu4uxpxYgj47370uhAQqy1CLND75XlM%3D",
		serverDomain: "docs.ics-it.ru",
		localDomain: "localhost",
	},
	settings: {
		"cucumber.features": ["e2e/test/steps/**/*.feature"],
		"cucumber.glue": ["e2e/runner/src/**/*.steps.ts"],
	},
};
