export const FIND_MERGE_CONFLICT = /(<<<<<<<[^(>>>>>>>)]*>>>>>>>.*)/g;

export const PARSE_MERGE_CONFLICT = /<<<<<<< [^\n]*\n([\s\S]*)?\n?=======\n([\s\S]*)>>>>>>> [^\n]*/;
