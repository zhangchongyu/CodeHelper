import * as vscode from 'vscode';
import { AutoHeadComment } from './code/AutoHeadComment';
import { CommentColor } from './code/CommentColor';
import { ColorHighLight } from './code/ColorHighLight';

let handlers: (new (context: vscode.ExtensionContext) => IModule)[] = [
	AutoHeadComment,
	CommentColor,
	ColorHighLight
];

let handlerInstances: IModule[] = [];

export async function activate(context: vscode.ExtensionContext) {
	for (const handler of handlers) {
		const h = new handler(context);
		await h.InitModule();
		handlerInstances.push(h);
	}
}

export function deactivate() {
	for (const handler of handlerInstances) {
		handler.Dispose();
	}
	handlerInstances = [];
}