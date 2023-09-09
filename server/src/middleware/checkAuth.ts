import { AuthenticationError } from 'apollo-server-core';
import { Context } from '../types/Context';
import { MiddlewareFn } from 'type-graphql';

export const checkAuth: MiddlewareFn = async ({ context }, next) => {
	const { req } = context as Context;

	if (!req.session.userId) {
		throw new AuthenticationError(
			'Not authenticated to perform GraphQL operations'
		);
	}

	return next();
};
