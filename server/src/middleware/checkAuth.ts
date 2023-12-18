import { GraphQLError } from 'graphql';
import { Context } from '../types/Context';
import { MiddlewareFn } from 'type-graphql';

export const checkAuth: MiddlewareFn = async ({ context }, next) => {
	const { req } = context as Context;

	if (!req.session.userId)
		throw new GraphQLError(
			'You are not authorized to perform this action.',
			{
				extensions: {
					code: 'FORBIDDEN',
				},
			}
		);

	return next();
};
