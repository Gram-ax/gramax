import React from "react";

const HTMLLi = (props: { children?: React.ReactNode }) => <li data-component="list-item">{props.children}</li>;
const HTMLListItem = (props: { children?: React.ReactNode }) => <li data-component="list-item">{props.children}</li>;
const HTMLTaskItem = (props: { children?: React.ReactNode }) => <li data-component="list-item">{props.children}</li>;
const HTMLBulletList = (props: { children?: React.ReactNode }) => (
	<ul data-component="bullet-list">{props.children}</ul>
);
const HTMLTaskList = (props: { children?: React.ReactNode }) => <ul data-component="task-list">{props.children}</ul>;
const HTMLOrderedList = (props: { children?: React.ReactNode }) => (
	<ol data-component="ordered-list">{props.children}</ol>
);

export { HTMLLi, HTMLListItem, HTMLTaskItem, HTMLBulletList, HTMLTaskList, HTMLOrderedList };
