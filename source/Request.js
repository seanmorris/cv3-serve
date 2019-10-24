const Url         = require('url');
const QueryString = require('querystring');

import { Path } from 'cv3-route/Path';

export class Request extends Path
{
	constructor(input)
	{
		const origin      = String(input.headers.host);
		const remote      = String(input.connection.remoteAddress);

		const splitHost   = origin.split(':', 2)
		const host        = String(splitHost[0] || '');
		const port        = parseInt(splitHost[1] || 0);
		const url         = new Url.parse(input.url);
		const path        = url.pathname;
		const method      = input.method;
		const queryString = url.search
			? url.search.substr(1)
			: '';

		const query       = QueryString.parse(queryString, '&', '=');

		const properties  = {
			origin, host, port, path
			, method, query, queryString
			, remote
		};

		super(path.substring(1));

		for(let name in properties)
		{
			Object.defineProperty(this, name, {
				enumerable: false,
				writable:   false,
				value:      properties[name]
			});
		}
	}

	node(offset = 0)
	{
		return this.nodes[ this.position + offset ];
	}
}
