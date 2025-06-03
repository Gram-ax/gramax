// @ts-ignore
// export { Divider } from "ics-ui-kit/components/Divider";
// Даже ts-ignore не помог, пишет что файла не существует, хотя в дев запуске все норм, пришлось вот так сделать:

export const Divider = () => {
	return <div className="h-px w-full bg-secondary-border" />;
};
