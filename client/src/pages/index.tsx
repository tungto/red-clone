import { Flex, Spinner, Stack } from '@chakra-ui/react';

import { PostsDocument, usePostsQuery } from '../generated/graphql';
import { addApolloState, initializeApollo } from '../lib/apolloClient';
import Layout from '../components/Layout';
import PostEditDeleteBtn from '../components/PostEditDeleteBtn';

const Index = () => {
	const { data, loading } = usePostsQuery();

	return (
		<Layout>
			{loading ? (
				<Spinner />
			) : (
				<Flex justify='left' width='80%' alignSelf='center'>
					<Stack spacing={8}>
						{data.getPosts.map((post) => {
							return (
								<Flex
									justifyItems='space-between'
									alignItems='center'>
									<h1 key={post.id}>{post.title}</h1>
									<PostEditDeleteBtn postId={post.id} />
								</Flex>
							);
						})}
					</Stack>
				</Flex>
			)}
		</Layout>
	);
};

export const getStaticProps = async () => {
	const apolloClient = initializeApollo();

	await apolloClient.query({
		query: PostsDocument,
	});

	return addApolloState(apolloClient, {
		props: {},
	});
};

export default Index;
