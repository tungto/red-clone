import { Box, Button, Spinner } from '@chakra-ui/react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import {
	PostDocument,
	PostIdsDocument,
	PostIdsQuery,
	PostQuery,
	usePostQuery,
} from '../../generated/graphql';
import { addApolloState, initializeApollo } from '../../lib/apolloClient';
import { limit } from '../index';
import NextLink from 'next/link';

const Post = () => {
	const router = useRouter();

	const { data, loading, error } = usePostQuery({
		variables: {
			id: router.query.id as string,
		},
	});

	if (error) {
		return <h1>{error.message}</h1>;
	}
	if (loading) {
		return <Spinner />;
	}

	if (!data.getPost) {
		return (
			<Layout>
				<h1>Post not found</h1>
				<Button>
					<NextLink href='/'>Back to homepage</NextLink>
				</Button>
			</Layout>
		);
	}

	return (
		<Layout>
			<Box>
				<h1>{data.getPost.title}</h1>
				<p>{data.getPost.text}</p>
				<Button>
					<NextLink href='/'>Back to homepage</NextLink>
				</Button>
			</Box>
		</Layout>
	);
};

export const getStaticPaths: GetStaticPaths = async () => {
	// [
	//   { params: { id: '15'} },
	//   { params: { id: '16'} }
	// ]

	const apolloClient = initializeApollo();

	const { data } = await apolloClient.query<PostIdsQuery>({
		query: PostIdsDocument,
		variables: { limit },
	});

	const paths = data.getPosts?.paginatedPosts?.map((post) => {
		return {
			params: {
				id: `${post.id}`,
			},
		};
	});

	console.log('GET STATIC PATH DATA: ', data.getPosts.paginatedPosts, paths);

	return {
		paths,
		fallback: 'blocking', // false or "blocking"
	};
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
	const apolloClient = initializeApollo();

	console.log('PARAMS: ', params);

	const post = await apolloClient.query<PostQuery>({
		query: PostDocument,
		variables: { id: params?.id },
	});

	console.log('POST: ', post);

	return addApolloState(apolloClient, {
		props: {},
	});
};

export default Post;
