import { GraphQLError } from 'graphql';
import { MiddlewareFn } from 'type-graphql';
import { Context } from '../types/Context';

export const checkAuth: MiddlewareFn = async ({ context }, next) => {
	const { req } = context as Context;

	if (!req.session.userId) {
		console.log('AUTHENTICATION ERROR!!!');
		throw new GraphQLError(
			'You are not authorized to perform this action.',
			{
				//@ts-expect-error
				extensions: {
					code: 'UNAUTHENTICATED',
					http: { status: 401 },
				},
			}
		);
	}

	return next();
};
