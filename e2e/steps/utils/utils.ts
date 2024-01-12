export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const makePath = (path: string): any => ({ type: "path", val: path });
