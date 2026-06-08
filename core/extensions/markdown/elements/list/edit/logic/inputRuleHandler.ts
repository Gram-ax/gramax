import { InputRule } from "@tiptap/core";

const inputRuleHandler = (inputRule: InputRule) => {
	return new InputRule({
		find: inputRule.find,
		handler: (props) => {
			const From = props.state.selection.$from;
			if (
				From.node(1)?.type.name === "heading" ||
				(From.node(-1)?.type.name === "listItem" && From.index(-1) === 0)
			)
				return null;

			return inputRule.handler(props);
		},
	});
};

export default inputRuleHandler;
