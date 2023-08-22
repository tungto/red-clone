import { Box, Button, FormControl } from '@chakra-ui/react';
import { Form, Formik, FormikHelpers } from 'formik';
import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';
import { RegisterInput, useRegisterMutation } from '../generated/graphql';
import { mapFieldErrors } from '../helpers/mapFieldErrors';
import { useRouter } from 'next/router';

const Register = () => {
	const initialValues = { username: '', password: '', email: '' };

	const router = useRouter();

	const [registerUser, { data, error, loading: _registerUserLoading }] =
		useRegisterMutation();

	// * stop loading icon by return
	const onRegisterSubmit = async (
		values: RegisterInput,
		{ setErrors }: FormikHelpers<RegisterInput>
	) => {
		const response = await registerUser({
			variables: {
				registerInput: values,
			},
		});

		if (response.data?.register.errors) {
			setErrors(mapFieldErrors(response.data?.register.errors));
		}

		// register successfully
		if (response.data?.register.user) {
			router.push('/');
		}
	};

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
