import { Box, Button, Flex, Spinner } from '@chakra-ui/react';
import { GetStaticPaths, GetStaticProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import PostEditDeleteBtn from '../../components/PostEditDeleteBtn';
import {
	PostDocument,
	PostIdsDocument,
	PostIdsQuery,
	PostQuery,
	usePostQuery,
} from '../../generated/graphql';
import { addApolloState, initializeApollo } from '../../lib/apolloClient';
import { limit } from '../index';

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
				<Box mb={10}>
					<h1>{data.getPost.title}</h1>
					<p>{data.getPost.text}</p>
				</Box>
				<Flex>
					<PostEditDeleteBtn
						postId={data.getPost.id}
						userId={data.getPost?.user.id}
					/>

					<NextLink href='/'>
						<Button ml={4}>Back to homepage</Button>
					</NextLink>
				</Flex>
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

	return {
		paths,
		fallback: 'blocking', // false or "blocking"
	};
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
	const apolloClient = initializeApollo();

	await apolloClient.query<PostQuery>({
		query: PostDocument,
		variables: { id: params?.id },
	});

	return addApolloState(apolloClient, {
		props: {},
	});
};

export default Post;
