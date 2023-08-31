import { Button, Flex, Spinner, Stack, Text } from '@chakra-ui/react';

import { Context, NetworkStatus } from '@apollo/client';
import Layout from '../components/Layout';
import PostEditDeleteBtn from '../components/PostEditDeleteBtn';
import { PostsDocument, usePostsQuery } from '../generated/graphql';
import { addApolloState, initializeApollo } from '../lib/apolloClient';
import { GetStaticProps } from 'next';
import NextLink from 'next/link';

export const limit = 3;

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
									<NextLink href={`/post/${post.id}`}>
										<h1>{post.title}</h1>
									</NextLink>

									<PostEditDeleteBtn postId={post.id} />
									{/* for privacy should get username instead */}
									<Text>
										{`posted by 
										${post.user.email || 'email hidden'}`}
									</Text>
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

export const getStaticProps: GetStaticProps = async (context: Context) => {
	const apolloClient = initializeApollo();
	console.log('CONTEXT: ');
	console.log(context);

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
