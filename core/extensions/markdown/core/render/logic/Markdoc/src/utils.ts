enum STATES {
	normal,
	string,
	escape,
}

export const tagWraps = {
	curly: {
		open: "{%",
		close: "%}",
	},
	angle: {
		open: "<",
		close: ">",
	},
};

export function findTagEnd(content: string, start = 0, tagClose: string) {
	let state = STATES.normal;
	for (let pos = start; pos < content.length; pos++) {
		const char = content[pos];

		switch (state) {
			case STATES.string:
				switch (char) {
					case '"':
						state = STATES.normal;
						break;
					case "\\":
						state = STATES.escape;
						break;
				}
				break;
			case STATES.escape:
				state = STATES.string;
				break;
			case STATES.normal:
				if (char === '"') state = STATES.string;
				else if (content.startsWith(tagClose, pos)) return pos;
		}
	}
}
