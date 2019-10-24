import { Inject } from 'cv3-inject/Inject';
import { Router } from 'cv3-route/Router';

import { Escape    } from './Escape';
import { Response  } from './Response';

import { DirectoryRouter } from './DirectoryRouter';

let i = 0;

export class RootRouter extends Inject(Router, {routes: {

	do_stuff: (router, request) => {
		return 'did stuff';
	}

	, [!1]: (router, request) => {

		request.position--;

		const catchAllRoute = Inject(DirectoryRouter, {
			directory: '/home/sean/cv3/serve/test/public'
		});

		return (new catchAllRoute).route(request)
	}

}}){};
