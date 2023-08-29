import { Box, Button, Flex, Spinner } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';
import { ForgotPasswordInput, useForgotPwMutation } from '../generated/graphql';
import useCheckAuth from '../utils/useCheckAuth';

const ForgotPassword = () => {
	const initialValues = { email: '' };
	const [forgotPw, { data, loading }] = useForgotPwMutation();

	const { loading: authLoading, data: authData } = useCheckAuth();

	const onForgotPwSubmit = async (values: ForgotPasswordInput) => {
		try {
			// submit form
			await forgotPw({
				variables: {
					forgotPwInput: values,
				},
			});
		} catch (error) {
			console.log(`ERROR - FORGOT PASSWORD ${error.message}`);
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
			<Formik initialValues={initialValues} onSubmit={onForgotPwSubmit}>
				{({ isSubmitting }) =>
					!loading && data?.forgotPassword ? (
						<Box>Please check your inbox</Box>
					) : (
						<Form>
							<Box mt={4}>
								<InputField
									name='email'
									placeholder='Email'
									label='Email'
									type='email'
								/>
							</Box>
							<Button
								type='submit'
								colorScheme='teal'
								mt={4}
								isLoading={isSubmitting}>
								Send Reset Password
							</Button>
						</Form>
					)
				}
			</Formik>
		</Wrapper>
	);
};

export default ForgotPassword;
