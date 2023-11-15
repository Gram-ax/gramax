import KeyboardRule from "./KeyboardRule";

type KeyboardShortcut = { key: string; rules: KeyboardRule[]; focusShouldBeInsideNode?: boolean };

export default KeyboardShortcut;
