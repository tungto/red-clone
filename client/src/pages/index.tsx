import { Flex, Spinner, Stack } from '@chakra-ui/react';

import { PostsDocument, usePostsQuery } from '../generated/graphql';
import { addApolloState, initializeApollo } from '../lib/apolloClient';
import Layout from '../components/Layout';

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
							return <h1 key={post.id}>{post.title}</h1>;
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
