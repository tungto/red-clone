import { gql } from '@apollo/client';
import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { ReactElement } from 'react';
import {
	MeDocument,
	MeQuery,
	useLogoutMutation,
	useMeQuery,
} from '../generated/graphql';
import { PostsCacheObject } from './PostEditDeleteBtn';

export const Navbar = () => {
	const { data, loading: meLoading } = useMeQuery();

	let body: ReactElement;

	const [logoutUser, { data: _logoutData, loading: logoutLoading }] =
		useLogoutMutation();

	const handleLogout = async () => {
		await logoutUser({
			update(cache, { data }) {
				console.log('DATA LOGOUT', data);
				if (data.logout) {
					cache.writeQuery<MeQuery>({
						query: MeDocument,
						data: { me: null },
					});

					cache.modify({
						fields: {
							getPosts(existing: PostsCacheObject) {
								console.log(
									`EXISTING CURSOR: `,
									existing.cursor
								);
								existing.paginatedPosts.forEach((post) => {
									cache.writeFragment({
										id: post.__ref,
										fragment: gql`
											fragment VoteType on Post {
												voteType
											}
										`,
										data: {
											voteType: 0,
										},
									});
								});

								return existing;
							},
						},
					});

					// cache.writeQuery<PostsQuery>({
					// 	query: PostsDocument,
					// 	data: { getPosts: null },
					// });
				}
			},
		});
	};

	if (meLoading) {
		body = null;
	} else if (!data?.me) {
		body = (
			<>
				<Link as={NextLink} mr={2} href='/login'>
					<Button>Login</Button>
				</Link>
				<Link as={NextLink} mr={2} href='/register'>
					<Button>Register</Button>
				</Link>
			</>
		);
	} else {
		body = (
			<Flex>
				<NextLink href='/create-post'>
					<Button mr={4}>Create Post</Button>
				</NextLink>
				<Button onClick={handleLogout} isLoading={logoutLoading} mr={2}>
					Logout
				</Button>
			</Flex>
		);
	}

	return (
		<Box bg='tan' p={4}>
			<Flex
				maxW={800}
				justifyContent='space-between'
				margin='auto'
				align='center'>
				<NextLink href='/'>
					<Heading>Reddit</Heading>
				</NextLink>
				<Box>{body}</Box>
			</Flex>
		</Box>
	);
};
