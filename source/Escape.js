export class Escape
{
	static html(string)
	{
		return String(string).replace(/\W/g, m=>`&#${m.charCodeAt(0)};`);
	}

	static css(string)
	{
		return String(string).replace(/\W/g, m=>`\\${m.charCodeAt(0)}`);
	}

	static js(string)
	{
		return String(string).replace(/\W/g, m=>`\\u${m.charCodeAt(0).toString(16).padStart(4, 0)}`);
	}
}
