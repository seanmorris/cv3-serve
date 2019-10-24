export class Response
{
	constructor(args)
	{
		if(!args
			|| typeof args !== 'object'
			|| args instanceof Promise
		){
			args = {
				code: args ? 200 : 404
				, headers: {}
				, content: args ? args : ''
			}
		}

		args = {
			code:      args.code    || 404
			, headers: args.headers || {}
			, content: args.content || ''
		};

		for(const name in args)
		{
			Object.defineProperty(this, name, {
				enumerable: false,
				writable:   false,
				value:      args[name]
			});
		}

		Object.freeze(this);
	}

	send(output)
	{
		let content = this.content;

		if(typeof content === 'function')
		{
			content = content();
		}

		if(!(content instanceof Promise))
		{
			content = Promise.resolve(content);
		}

		content.then((actualContent) => {

			let response = this;

			if(actualContent instanceof Response)
			{
				response      = actualContent;
				actualContent = String(response.content);
			}
			else if(typeof actualContent !== 'string')
			{				
				actualContent = String(actualContent);
			}

			output.writeHead(response.code, response.headers);
			output.end(actualContent, 'binary');

		}).catch(error => {

			output.writeHead(
				(error && typeof error === 'object')
					? error.code || 404
					: 404
			);

			output.end(
				(error && typeof error === 'object')
					? error.content || String(404)
					: error
				, 'utf-8'
			);

		});
	}
}
