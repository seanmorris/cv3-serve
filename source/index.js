import { Path   } from 'cv3-route/Path';
import { Inject } from 'cv3-inject/Inject';

import { Server          } from './Server';
import { RootRouter      } from './RootRouter';
import { DirectoryRouter } from './DirectoryRouter';

const args   = process.argv.slice(2);
const port   = args[0] || 8125;
const router = new RootRouter;
// const router = new (Inject(DirectoryRouter, {
// 	directory: '/home/sean/cv3/serve/test/public'
// }));

let   i = 0;

const server = new Server((request) => {

	console.error(
		'[%s] %s: %s'
		, request.remote
		, request.method
		, request.path
	);

	const response = router.route(request); 

	return response;

});

server.listen(port);

console.log('Listening on port %d', port);
