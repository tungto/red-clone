import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import {
	MeDocument,
	MeQuery,
	useLogoutMutation,
	useMeQuery,
} from '../generated/graphql';
import { ReactElement } from 'react';

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
					Login
				</Link>

				<Link as={NextLink} mr={2} href='/register'>
					Register
				</Link>
			</>
		);
	} else {
		body = (
			<Button onClick={handleLogout} isLoading={logoutLoading} mr={2}>
				Logout
			</Button>
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
