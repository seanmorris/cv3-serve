import fs   from 'fs';
import path from 'path';

import { Response } from './Response';

const isBlockedSymbol = Symbol('readFile');
const readFileSymbol  = Symbol('readFile');
const NOT_FOUND       = -2;

export class Directory
{
	constructor(path, parent)
	{
		const properties = {path, parent};

		for(let name in properties)
		{
			Object.defineProperty(this, name, {
				enumerable: false,
				writable:   false,
				value:      properties[name]
			});
		}

		Object.defineProperty(this, 'access', {
				enumerable: false,
				writable:   true,
				value:      {}
			});

		Object.preventExtensions(this);
	}

	read(filename = '')
	{
		const cleanPath  = path.normalize(
			Array.isArray(this.path)
				? this.path.join('/')
				: this.path
		);

		const accessFile = cleanPath + '/.cvaccess.json';

		filename = filename.replace(/^\/+/, '');

		const cleanFilename = path.normalize(filename).replace(/^(\.\.\/?)+/, '');

		this.access = this.parent
			? this.parent.access
			: {};

		const accessPromise = new Promise((accept, reject) => {

			this.constructor[readFileSymbol](accessFile, this).then((content) => {

				this.access = JSON.parse(content);

				accept(this.access);

			}).catch((error) => {

				if(error && error.errno === NOT_FOUND)
				{
					accept(this.access);
				}

				reject(error);
			});
		});

		return accessPromise.then((access) => new Promise((accept, reject) => {

			fs.stat(cleanPath, (error, stats) => {

				if(error && error.errno === NOT_FOUND)
				{
					return reject(new Response({code: 404}));
				}
				else if(error)
				{
					return reject(new Response({
						content: `${error.errno}: ${error}`
						, code:  500
					}));
				}

				if(filename && filename !== '/')
				{
					const filepath = `${cleanPath}/${cleanFilename}`;

					if(this.constructor[isBlockedSymbol](cleanFilename, access))
					{
						return reject({code: 404});
					}

					return this.constructor[readFileSymbol](filepath, this).then((content)=>{

						if(content instanceof Directory)
						{
							return accept(content.read());
						}

						const extension = path.extname(filepath).substr(1);
						const headers   = {};

						if(access.mime && access.mime[extension])
						{
							headers['content-type'] = access.mime[extension];
						}

						return accept(new Response({
							content, headers
							, code:  200
						}));

					}).catch((error) => {

						if(error && error.errno === NOT_FOUND)
						{
							return reject(new Response({code: 404}));
						}
						else if(error)
						{
							return reject(new Response({
								content: `${error.errno}: ${error}`
								, code:   500
							}));
						}
					});

				}

				return fs.readdir(cleanPath, (error, items) => {

					if(error)
					{
						return reject(new Response({
							content: `${error.errno}: ${error}`
							, code:   500
						}));
					}

					Promise.all(items.map((item) => new Promise((accept,reject) => {

						if(this.constructor[isBlockedSymbol](item, access))
						{
							return accept(false);
						}

						const filename = `${cleanPath}/${item}`;

						fs.stat(filename, (error, stats) => {
							if(!stats.isFile())
							{
								accept(`<li><a href = "${item}/">${item}/</a></li>`);
							}

							accept(`<li><a href = "${item}">${item}</a></li>`);
						});

					}))).then((results)=>{

						const list = results.sort().filter(x=>x);

						list.unshift(`<li><a href = "../">..</a></li>`);

						return accept(`<!DOCTYPE HTML>
<body><ul>
${list.join("\n")}
</ul></body>`
						);

					});
				});
			});

		}));
	}

	static [readFileSymbol](filename, parent)
	{
		return new Promise((accept, reject) => {

			return fs.stat(filename, (error, stats) => {

				if(error)
				{
					return reject(error);
				}

				if(!stats.isFile())
				{
					const subDir = new this(filename, parent)

					return accept(subDir);
				}

				return fs.readFile(filename, 'binary', (error, contents) => {

					if(error)
					{
						return reject(new Response({
							content: `${error.errno}: ${error}`
							, code:   500
						}));
					}

					accept(contents);

				});
			});
		});
	}

	static [isBlockedSymbol](filename, access)
	{
		if(access && access.block)
		{
			for(const pattern of access.block)
			{
				if(path.basename(filename).match(pattern))
				{
					return true;
				}
			}
		}

		return false;
	}
}
