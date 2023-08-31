import { useMemo } from 'react';
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
import { Post } from '../generated/graphql';

export const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__';

let apolloClient: ApolloClient<NormalizedCacheObject>;

/**
 * https://dev.to/ivanms1/take-your-next-js-graphql-typescript-setup-to-the-next-level-5b0i
 */
interface IApolloStateProps {
	[APOLLO_STATE_PROP_NAME]?: NormalizedCacheObject;
}

const errorLink = onError(({ graphQLErrors, networkError }) => {
	if (graphQLErrors)
		graphQLErrors.forEach(({ message, locations, path }) =>
			console.log(
				`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
			)
		);
	if (networkError) console.log(`[Network error]: ${networkError}`);
});

const httpLink = new HttpLink({
	uri: 'http://localhost:4000/graphql', // Server URL (must be absolute)
	credentials: 'include', // Additional fetch() options like `credentials` or `headers`
});

/**
 * https://www.apollographql.com/docs/react/caching/cache-configuration/
 * @returns
 */
function createApolloClient() {
	return new ApolloClient({
		connectToDevTools: true,
		ssrMode: typeof window === 'undefined',
		link: from([errorLink, httpLink]),
		cache: new InMemoryCache({
			typePolicies: {
				Query: {
					fields: {
						getPosts: {
							keyArgs: false,
							merge(existing, incoming) {
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
								return { ...incoming, paginatedPosts };
							},
						},
					},
				},
			},
		}),
	});
}

export function initializeApollo(
	initialState: NormalizedCacheObject | null = null
) {
	const _apolloClient = apolloClient ?? createApolloClient();

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
	const store = useMemo(() => initializeApollo(state), [state]);
	return store;
}
