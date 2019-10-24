import fs   from 'fs';
import path from 'path';

import { Inject } from 'cv3-inject/Inject';
import { Router } from 'cv3-route/Router';

import { Response } from './Response';

const isBlockedSymbol = Symbol('isBlocked');
const readFileSymbol  = Symbol('readFile');
const accessSymbol    = Symbol('access');
const NOT_FOUND       = -2;

export class DirectoryRouter extends Inject(Router, {routes: {

	[/.*/]: (router, request) => {

		const filename = request.node(-1);

		return router.constructor[accessSymbol]().then((access)=>{

			return router.constructor[readFileSymbol](filename);

		}).then((content)=>{

			if(DirectoryRouter.isPrototypeOf(content))
			{
				const subRouter = new content;

				return subRouter.route(request);
			}

			const headers   = {};
			const extension = path.extname(filename).substr(1);

			if(router.constructor.access.mime
				&& router.constructor.access.mime[extension]
			){
				console.log(router.constructor.access.mime[extension]);

				headers['Content-Type'] = router.constructor.access.mime[extension];
			}

			return new Response({
				content
				, headers
				, code:  200
			});

		}).catch((error)=>{

			console.log(error);

		});

	}

	, index: (router, request) => {

		if(request.path.substr(-1) !== '/')
		{
			return new Response({
				headers: {
					location: `${request.path}/?${request.queryString}`
				}
				, code:  303
			});
		}

		return router.list();
	}

}}){
	list()
	{
		const cleanPath  = path.normalize(
			Array.isArray(this.directory)
				? this.directory.join('/')
				: this.directory
		);

		return this.constructor[accessSymbol]().then(
			(access) => new Promise((accept, reject) => fs.readdir(cleanPath, (error, items) => {

				if(error)
				{
					return reject(new Response({
						content: `${error.errno}: ${error}`
						, code:   500
					}));
				}

				Promise.all(items.map((item) => new Promise((accept,reject) => {

					if(item.match(/^\./))
					{
						return accept(false);
					}

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
			})
		));
	}

	static [accessSymbol]()
	{
		if(this.access)
		{
			return Promise.resolve(this.access);
		}

		return new Promise((accept, reject) => {

			this[readFileSymbol]('.cvaccess.json', false).then((content) => {

				this.access = JSON.parse(content);

				accept(this.access);

			}).catch((error) => {

				if(error && error.errno === NOT_FOUND)
				{
					if(this.parent)
					{
						return this.parent[accessSymbol]().then((access)=>{
							this.access = access;

							accept(access);
						});
					}

					console.log(error);

					this.access = {};

					return accept(this.access);
				}

				console.log(error);

				return reject(error);
			});
		});
	}

	static [readFileSymbol](filename, publicRead = true)
	{
		const cleanPath  = path.normalize(
			Array.isArray(this.directory)
				? this.directory.join('/')
				: this.directory
		);

		const cleanFilename = path.normalize(filename);

		if(publicRead && cleanFilename.match(/^\./))
		{
			return Promise.reject('Nope.');
		}

		const cleanFilePath = cleanPath + '/' + cleanFilename;

		return new Promise((accept, reject) => {

			return fs.stat(cleanFilePath, (error, stats) => {

				if(error)
				{
					return reject(error);
				}

				if(!stats.isFile())
				{
					const cleanSubPath = path.normalize(filename);

					if(cleanSubPath.match(/^\./))
					{
						return reject('Nope.');
					}

					const subRouter = Inject(DirectoryRouter, {
						directory: cleanPath + '/' + cleanFilename
						, parent:  this
					});

					accept(subRouter);
				}

				return fs.readFile(cleanFilePath, 'binary', (error, contents) => {

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

	static [isBlockedSymbol](filename)
	{
		if(this.access && this.access.block)
		{
			for(const pattern of this.access.block)
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
