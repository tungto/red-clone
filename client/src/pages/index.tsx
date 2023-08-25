import { Spinner } from '@chakra-ui/react';
import { Navbar } from '../components/Navbar';
import { PostsDocument, usePostsQuery } from '../generated/graphql';
import { addApolloState, initializeApollo } from '../lib/apolloClient';

const Index = () => {
	const { data, loading } = usePostsQuery();

	if (loading) {
		return <Spinner />;
	}

	console.log(data);
	return (
		<>
			<Navbar />
			{data.getPosts.map((post) => {
				return <h1 key={post.id}>{post.title}</h1>;
			})}
		</>
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
