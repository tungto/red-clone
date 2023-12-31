import {
	Box,
	Button,
	Flex,
	FormControl,
	Spinner,
	useToast,
} from '@chakra-ui/react';
import { Form, Formik, FormikHelpers } from 'formik';
import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';
import {
	MeDocument,
	MeQuery,
	RegisterInput,
	useRegisterMutation,
} from '../generated/graphql';
import { mapFieldErrors } from '../helpers/mapFieldErrors';
import { useRouter } from 'next/router';
import useCheckAuth from '../utils/useCheckAuth';

const Register = () => {
	const initialValues = { username: '', password: '', email: '' };

	const router = useRouter();

	const toast = useToast();
	const [registerUser, { data, error, loading: _registerUserLoading }] =
		useRegisterMutation();

	const { loading: authLoading, data: authData } = useCheckAuth();

	// * stop loading icon by return
	const onRegisterSubmit = async (
		values: RegisterInput,
		{ setErrors }: FormikHelpers<RegisterInput>
	) => {
		const response = await registerUser({
			variables: {
				registerInput: values,
			},
			// have to update cache here to get the latest data instead of cache
			update(cache, { data }) {
				if (data?.register.success) {
					cache.writeQuery<MeQuery>({
						query: MeDocument,
						data: { me: data.register.user },
					});
				}
			},
		});

		if (response.data?.register.errors) {
			setErrors(mapFieldErrors(response.data?.register.errors));
		}

		// register successfully
		if (response.data?.register.user) {
			toast({
				title: 'Account created.',
				description: `We've created your account for ${response.data?.register.user.username}.`,
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
			{error && <p>Failed to register</p>}
			{data && data?.register.success && (
				<p> Register successfully ${JSON.stringify(data)}</p>
			)}
			<Formik initialValues={initialValues} onSubmit={onRegisterSubmit}>
				{({ isSubmitting }) => (
					<Form>
						<FormControl>
							<Box mt={4}>
								<InputField
									name='username'
									placeholder='Username'
									label='Username'
									type='text'
								/>
							</Box>
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
								Register
							</Button>
						</FormControl>
					</Form>
				)}
			</Formik>
		</Wrapper>
	);
};

export default Register;
