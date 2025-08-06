import { InputRule } from "@tiptap/core";

const inputRuleHandler = (inputRule: InputRule) => {
	return new InputRule({
		find: inputRule.find,
		handler: (props) => {
			const $from = props.state.selection.$from;
			if (
				$from.node(1)?.type.name === "heading" ||
				($from.node(-1)?.type.name === "listItem" && $from.index(-1) === 0)
			)
				return null;

			return inputRule.handler(props);
		},
	});
};

export default inputRuleHandler;
