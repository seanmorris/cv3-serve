const Http = require('http');

import { Request  } from './Request';
import { Response } from './Response';

export class Server
{
	constructor(callback)
	{
		if(typeof callback !== 'function')
		{
			const c  = callback;
			callback = () => c;
		}

		this.callback = callback;
	}

	listen(port)
	{
		const server = Http.createServer((iin, out) => {

			let request  = new Request(iin);
			let response = this.callback(request);

			if(!(response instanceof Response))
			{
				response = new Response(response);
			}

			response.send(out);

		});

		server.listen(port);
	}
}
