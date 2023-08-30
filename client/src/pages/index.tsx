import { Button, Flex, Spinner, Stack } from '@chakra-ui/react';

import { NetworkStatus } from '@apollo/client';
import Layout from '../components/Layout';
import PostEditDeleteBtn from '../components/PostEditDeleteBtn';
import { PostsDocument, usePostsQuery } from '../generated/graphql';
import { addApolloState, initializeApollo } from '../lib/apolloClient';

export const limit = 2;

const Index = () => {
	const { data, loading, fetchMore, networkStatus } = usePostsQuery({
		variables: {
			limit,
		},
		notifyOnNetworkStatusChange: true,
	});

	const loadingMorePosts = networkStatus === NetworkStatus.fetchMore;

	const loadMorePosts = () => {
		fetchMore({ variables: { cursor: data?.getPosts?.cursor } });
	};

	return (
		<Layout>
			{loading && !loadingMorePosts ? (
				<Spinner />
			) : (
				<Flex justify='left' width='80%' alignSelf='center'>
					<Stack spacing={8}>
						{data.getPosts?.paginatedPosts?.map((post) => {
							return (
								<Flex
									justifyItems='space-between'
									alignItems='center'
									key={post.id}>
									<h1>{post.title}</h1>
									<PostEditDeleteBtn postId={post.id} />
								</Flex>
							);
						})}
					</Stack>
				</Flex>
			)}

			{data?.getPosts?.hasMore && (
				<Flex>
					<Button
						m='auto'
						my={8}
						isLoading={loadingMorePosts}
						onClick={loadMorePosts}>
						{loadingMorePosts ? 'Loading' : 'Show more'}
					</Button>
				</Flex>
			)}
		</Layout>
	);
};

export const getStaticProps = async () => {
	const apolloClient = initializeApollo();

	await apolloClient.query({
		query: PostsDocument,
		variables: {
			limit,
		},
	});

	return addApolloState(apolloClient, {
		props: {},
	});
};

export default Index;
