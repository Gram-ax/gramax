import { Shortcut } from "@ui-kit/Shortcut";
import React from "react";

export default function Kbd({ text }: { text: string }) {
	return <Shortcut>{text}</Shortcut>;
}
