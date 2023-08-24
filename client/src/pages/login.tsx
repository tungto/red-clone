import {
	Box,
	Button,
	Flex,
	FormControl,
	Spinner,
	useToast,
} from '@chakra-ui/react';
import { Form, Formik, FormikHelpers } from 'formik';
import { useRouter } from 'next/router';
import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';
import {
	LoginInput,
	MeDocument,
	MeQuery,
	useLoginMutation,
} from '../generated/graphql';
import { mapFieldErrors } from '../helpers/mapFieldErrors';
import useCheckAuth from '../utils/useCheckAuth';

const Login = () => {
	const initialValues = { email: '', password: '' };

	const router = useRouter();
	const toast = useToast();
	const [loginUser, { loading: _registerUserLoading, data, error }] =
		useLoginMutation();

	const { loading: authLoading, data: authData } = useCheckAuth();

	// * stop loading icon by return
	const onLoginSubmit = async (
		values: LoginInput,
		{ setErrors }: FormikHelpers<LoginInput>
	) => {
		const response = await loginUser({
			variables: {
				loginInput: values,
			},
			update(cache, { data }) {
				console.log('DATA LOGIN: ', data);

				// const meData = cache.readQuery({ query: MeDocument });
				// console.log('MEDATA', meData);

				if (data?.login.success) {
					cache.writeQuery<MeQuery>({
						query: MeDocument,
						data: { me: data.login.user },
					});
				}
			},
		});

		if (response.data?.login.errors) {
			setErrors(mapFieldErrors(response.data?.login.errors));
		}

		// login successfully
		if (response.data?.login.user) {
			toast({
				title: 'Account created.',
				description: `We've created your account for ${response.data?.login.user.username}.`,
				status: 'success',
				duration: 9000,
				isClosable: true,
			});
			router.push('/');
		}
	};

	if (authLoading || (!authLoading && authData?.me)) {
		return (
			<Flex justifyContent='center' alignItems='center' minH='100vh'>
				<Spinner />;
			</Flex>
		);
	}

	return (
		<Wrapper>
			{error && <p>Failed to login. Internal server error</p>}

			<Formik initialValues={initialValues} onSubmit={onLoginSubmit}>
				{({ isSubmitting }) => (
					<Form>
						<FormControl>
							<Box mt={4}>
								<InputField
									name='email'
									placeholder='Email'
									label='Email'
									type='text'
								/>
							</Box>
							<Box mt={4}>
								<InputField
									name='password'
									placeholder='Password'
									label='Password'
									type='password'
								/>
							</Box>
							<Button
								type='submit'
								colorScheme='teal'
								mt={4}
								isLoading={isSubmitting}>
								Login
							</Button>
						</FormControl>
					</Form>
				)}
			</Formik>
		</Wrapper>
	);
};

export default Login;
