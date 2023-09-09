import {
	Box,
	Button,
	Flex,
	Heading,
	Spinner,
	Stack,
	Text,
} from '@chakra-ui/react';

import { NetworkStatus } from '@apollo/client';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import NextLink from 'next/link';
import Layout from '../components/Layout';
import PostEditDeleteBtn from '../components/PostEditDeleteBtn';
import UpVoteSection from '../components/UpvoteSection';
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

	console.log(`index data: `, data);

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
									<UpVoteSection post={post} />
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

export const getServerSideProps: GetServerSideProps = async (
	context: GetServerSidePropsContext
) => {
	const apolloClient = initializeApollo({ headers: context.req.headers });
	// console.log('CONTEXT.REQ.HEADERS: ', context.req.headers);

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

/**
 * Will get issue cookie doesn't send on when the page load => voteType get undefined (don't know if posts voted or not)
 * To fixed this issue, we use getServerSideProps to pass cookie on each request
 * https://www.rockyourcode.com/nextjs-with-apollo-ssr-cookies-and-typescript/
 */
// export const getStaticProps: GetStaticProps = async (
// 	context: GetStaticPropsContext
// ) => {
// 	const apolloClient = initializeApollo();
// 	console.log('CONTEXT: ', context);

// 	await apolloClient.query({
// 		query: PostsDocument,
// 		variables: {
// 			limit,
// 		},
// 	});

// 	return addApolloState(apolloClient, {
// 		props: {},
// 	});
// };

export default Index;
