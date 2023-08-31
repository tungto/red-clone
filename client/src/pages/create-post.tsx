import { Box, Button, Flex, Spinner, useToast } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import InputField from '../components/InputField';
import Layout from '../components/Layout';
import { CreatePostInput, useCreatePostMutation } from '../generated/graphql';
import useCheckAuth from '../utils/useCheckAuth';

const CreatePost = () => {
	const initialValues = { text: '', title: '' };

	const toast = useToast();
	const router = useRouter();

	const [createPost, {}] = useCreatePostMutation();

	const { loading: authLoading, data: authData } = useCheckAuth();

	const onCreatePostSubmit = async (values: CreatePostInput) => {
		const response = await createPost({
			variables: {
				createPostInput: values,
			},
		});

		if (response.data?.createPost.success) {
			toast({
				title: 'Post created.',
				description: `We've created your account for ${response.data?.createPost.post.title}.`,
				status: 'success',
				duration: 2000,
				isClosable: true,
			});

			router.push('/');
		}
	};

	// protect route
	if (authLoading || (!authLoading && !authData?.me)) {
		return (
			<Flex justifyContent='center' alignItems='center' minH='100vh'>
				<Spinner />
			</Flex>
		);
	}

	return (
		<Layout>
			<Formik initialValues={initialValues} onSubmit={onCreatePostSubmit}>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name='title'
							placeholder='Title'
							label='Title'
							type='text'
						/>

						<Box mt={4}>
							<InputField
								textarea
								name='text'
								placeholder='Text'
								label='Text'
								type='textarea'
							/>
						</Box>

						<Flex
							justifyContent='space-between'
							alignItems='center'
							mt={4}>
							<Button
								type='submit'
								colorScheme='teal'
								isLoading={isSubmitting}>
								Create Post
							</Button>
							<NextLink href='/'>
								<Button>Go back to Homepage</Button>
							</NextLink>
						</Flex>
					</Form>
				)}
			</Formik>
		</Layout>
	);
};

export default CreatePost;
