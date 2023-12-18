import {
	ApolloClient,
	HttpLink,
	InMemoryCache,
	NormalizedCacheObject,
	from,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import merge from 'deepmerge';
import isEqual from 'lodash/isEqual';
import { useMemo } from 'react';
import { PaginatedPosts, Post } from '../generated/graphql';
import { IncomingHttpHeaders } from 'http';
import fetch from 'isomorphic-unfetch';
import Router from 'next/router';
import { __prod__ } from '../../../server/src/constants';

export const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__';
export const UNAUTHENTICATED_ERROR_CODE = 'FORBIDDEN';

type InitializeObject = {
	initialState?: NormalizedCacheObject | null;
	headers?: IncomingHttpHeaders | null;
};
let apolloClient: ApolloClient<NormalizedCacheObject>;

/**
 * https://dev.to/ivanms1/take-your-next-js-graphql-typescript-setup-to-the-next-level-5b0i
 */
interface IApolloStateProps {
	[APOLLO_STATE_PROP_NAME]?: NormalizedCacheObject;
}

const errorLink = onError(({ graphQLErrors, networkError, response }) => {
	if (graphQLErrors)
		graphQLErrors.forEach(({ message, locations, path, extensions }) => {
			console.log(
				`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
			);

			if (
				extensions?.code === UNAUTHENTICATED_ERROR_CODE &&
				response.errors
			) {
				// to hide the error
				response.errors = undefined;
				Router.replace('/login');
			}
		});

	if (networkError) console.log(`[Network error]: ${networkError}`);
});

/**
 * https://www.apollographql.com/docs/react/caching/cache-configuration/
 * @returns
 */
function createApolloClient(headers: IncomingHttpHeaders | null = null) {
	// source: https://www.rockyourcode.com/nextjs-with-apollo-ssr-cookies-and-typescript/
	// isomorphic fetch for passing the cookies along with each GraphQL request
	const enhanceFetch = async (url: RequestInfo, init: RequestInit) => {
		const response = await fetch(url, {
			...init,
			headers: {
				...init.headers,
				'Access-Control-Allow-Origin': '*',
				Cookie: headers?.cookie ?? '',
			},
		});

		return response;
	};

	const httpLink = new HttpLink({
		uri: 'http://localhost:4000/graphql', // Server URL (must be absolute)
		credentials: 'include', // Additional fetch() options like `credentials` or `headers`,
		fetch: enhanceFetch,
	});

	return new ApolloClient({
		connectToDevTools: !__prod__,
		ssrMode: typeof window === 'undefined',
		link: from([errorLink, httpLink]),
		cache: new InMemoryCache({
			typePolicies: {
				Mutation: {
					fields: {
						createPost: {
							keyArgs: false,
							merge(
								existing: PaginatedPosts,
								incoming: PaginatedPosts
							) {
								console.log('Cache - typePolicies - Mutation');
								console.log(existing, incoming);
							},
						},
					},
				},
				Query: {
					fields: {
						getPosts: {
							keyArgs: false,
							merge(
								existing: PaginatedPosts,
								incoming: PaginatedPosts
							) {
								// console.log('EXISTING: ', existing);
								// console.log('INCOMING: ', incoming);

								let paginatedPosts: Post[] = [];

								if (existing && existing.paginatedPosts) {
									paginatedPosts = paginatedPosts.concat(
										existing.paginatedPosts
									);
								}

								if (incoming && incoming.paginatedPosts) {
									paginatedPosts = paginatedPosts.concat(
										incoming.paginatedPosts
									);
								}

								// create object from other fields of incoming with paginatedPosts
								return {
									...incoming,
									paginatedPosts,
								};
							},
						},
					},
				},
			},
		}),
	});
}

export function initializeApollo(
	{ headers, initialState }: InitializeObject = {
		headers: null,
		initialState: null,
	}
) {
	const _apolloClient = apolloClient ?? createApolloClient(headers);

	// If your page has Next.js data fetching methods that use Apollo Client, the initial state
	// gets hydrated here
	if (initialState) {
		// Get existing cache, loaded during client side data fetching
		const existingCache = _apolloClient.extract();

		// Merge the initialState from getStaticProps/getServerSideProps in the existing cache
		const data = merge(existingCache, initialState, {
			// combine arrays using object equality (like in sets)
			arrayMerge: (destinationArray, sourceArray) => [
				...sourceArray,
				...destinationArray.filter((d) =>
					sourceArray.every((s) => !isEqual(d, s))
				),
			],
		});

		// Restore the cache with the merged data
		_apolloClient.cache.restore(data);
	}
	// For SSG and SSR always create a new Apollo Client
	if (typeof window === 'undefined') return _apolloClient;
	// Create the Apollo Client once in the client
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function addApolloState(
	client: ApolloClient<NormalizedCacheObject>,
	pageProps: { props: IApolloStateProps }
) {
	if (pageProps?.props) {
		pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract();
	}

	return pageProps;
}

export function useApollo(pageProps: IApolloStateProps) {
	const state = pageProps[APOLLO_STATE_PROP_NAME];
	const store = useMemo(
		() => initializeApollo({ initialState: state }),
		[state]
	);
	return store;
}
