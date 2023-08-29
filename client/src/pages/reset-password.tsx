import {
	Alert,
	AlertIcon,
	AlertTitle,
	Box,
	Button,
	Flex,
	Link,
	Spinner,
} from '@chakra-ui/react';
import { Form, Formik, FormikHelpers } from 'formik';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';
import {
	MeDocument,
	MeQuery,
	ResetPasswordInput,
	useResetPasswordMutation,
} from '../generated/graphql';
import { mapFieldErrors } from '../helpers/mapFieldErrors';
import useCheckAuth from '../utils/useCheckAuth';

const ForgotPassword = () => {
	const initialValues = { password: '' };
	const [resetPw, { data, loading, error: resetMutationError }] =
		useResetPasswordMutation();
	const [tokenError, setTokenError] = useState('');
	const { query, push } = useRouter();
	const { loading: authLoading, data: authData } = useCheckAuth();

	const onResetPwSubmit = async (
		values: ResetPasswordInput,
		{ setErrors }: FormikHelpers<ResetPasswordInput>
	) => {
		try {
			// submit form
			const response = await resetPw({
				variables: {
					resetPwInput: values,
					userId: query.userId as string,
					token: query.token as string,
				},
				update(cache, { data }) {
					if (data?.resetPassword.success) {
						cache.writeQuery<MeQuery>({
							query: MeDocument,
							data: { me: data.resetPassword.user },
						});
					}
				},
			});

			if (response.data.resetPassword.errors) {
				const fieldErrors = mapFieldErrors(
					response.data.resetPassword.errors
				);
				if ('token' in fieldErrors) {
					setTokenError(fieldErrors.token);
				}
				setErrors(fieldErrors);
			}

			if (response.data.resetPassword.success) {
				push('/');
			}
		} catch (error) {
			console.log(`ERROR - RESET PASSWORD ${error.message}`);
		}
	};

	if (authLoading || (!authLoading && authData?.me)) {
		return (
			<Flex justifyContent='center' alignItems='center' minH='100vh'>
				<Spinner />
			</Flex>
		);
	}

	if (!query.token || !query.userId) {
		return (
			<Wrapper size='small'>
				<Alert status='error'>
					<AlertIcon />
					<AlertTitle>Invalid password change request</AlertTitle>
				</Alert>

				<Flex mt={2}>
					<NextLink href='/login'>
						<Link ml='auto'>Back to Login</Link>
					</NextLink>
				</Flex>
			</Wrapper>
		);
	}

	return (
		<Wrapper>
			{resetMutationError && resetMutationError.message}
			<Formik initialValues={initialValues} onSubmit={onResetPwSubmit}>
				{({ isSubmitting }) => {
					if (!loading && data?.resetPassword.success) {
						return (
							<>
								<Box>Reset password successfully</Box>
								<Button mt={4}>
									<Link as={NextLink} href='/'>
										Back to homepage
									</Link>
								</Button>
							</>
						);
					} else {
						return (
							<Form>
								<Box mt={4}>
									<InputField
										name='password'
										placeholder='New Password'
										label='New Password'
										type='password'
									/>
								</Box>
								{tokenError && (
									<Box>
										<Box color='red'>{tokenError}</Box>
										<Button mt={4}>
											<Link as={NextLink} href='/'>
												Back to homepage
											</Link>
										</Button>
									</Box>
								)}
								<Button
									type='submit'
									colorScheme='teal'
									mt={4}
									isLoading={isSubmitting}>
									Reset Password
								</Button>
							</Form>
						);
					}
				}}
			</Formik>
		</Wrapper>
	);
};

export default ForgotPassword;
