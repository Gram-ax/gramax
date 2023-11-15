export default {
	title: "<p>$VAR1 Title $VAR2</p>",
	type: "object",
	properties: {
		varsTest: {
			title: "<p>title $VAR1 title2 title3 $VAR2 title4</p>",
			format: "format $VAR1 $VAR2",
			description: "<p>$VAR1 $VAR2 description</p>",
			type: "string",
		},
	},
	required: ["varsTest"],
	$schema: "http://json-schema.org/draft-07/schema#",
};
