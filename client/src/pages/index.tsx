import {
	Box,
	Button,
	Flex,
	Heading,
	Spinner,
	Stack,
	Text,
} from '@chakra-ui/react';

import { Context, NetworkStatus } from '@apollo/client';
import { GetStaticProps } from 'next';
import NextLink from 'next/link';
import Layout from '../components/Layout';
import PostEditDeleteBtn from '../components/PostEditDeleteBtn';
import { PostsDocument, usePostsQuery } from '../generated/graphql';
import { addApolloState, initializeApollo } from '../lib/apolloClient';

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
				<Flex justify='left' alignSelf='center'>
					<Stack spacing={8} minW='100%'>
						{data.getPosts?.paginatedPosts?.map((post) => {
							return (
								<Flex
									key={post.id}
									p={5}
									shadow='md'
									borderWidth='1px'>
									<Box flex={1}>
										<NextLink href={`/post/${post.id}`}>
											<Heading fontSize='xl'>
												{post.title}
											</Heading>
										</NextLink>
										<Text>posted by {post.user.email}</Text>
										<Flex align='center'>
											<Text mt={4}>
												{post.textSnippet}
											</Text>
											<Box ml='auto'>
												<PostEditDeleteBtn
													postId={post.id}
													userId={post.user.id}
												/>
											</Box>
										</Flex>
									</Box>
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
