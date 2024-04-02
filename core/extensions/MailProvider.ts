import nodemailer from "nodemailer";

export default class MailProvider {
	private _transporter;

	constructor(private _credentials: { user: string; password: string }) {
		this._transporter = nodemailer.createTransport({
			host: "smtp.yandex.ru",
			port: "587",
			auth: _credentials,
			tls: { ciphers: "SSLv3" },
		});
	}

	public getMail(): string {
		return this._credentials.user;
	}

	public async sendMail(to: string, subject: string, text: string, html: string) {
		try {
			await this._transporter.sendMail({
				from: this._credentials.user,
				to: to,
				subject: subject,
				text: text,
				html: html,
			});
		} catch (error) {
			// logger.logError(error);
		}
	}
}
