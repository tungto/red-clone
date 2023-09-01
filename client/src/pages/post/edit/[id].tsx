import { Box, Button, Flex, Spinner } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import {
	UpdatePostInput,
	useMeQuery,
	usePostQuery,
	useUpdatePostMutation,
} from '../../../generated/graphql';
import InputField from '../../../components/InputField';

const EditPost = () => {
	const router = useRouter();
	const { data, loading: postLoading } = usePostQuery({
		variables: {
			id: router.query.id as string,
		},
	});

	const { data: meData, loading: meLoading } = useMeQuery();

	const [editPost, { data: updatePostData }] = useUpdatePostMutation();

	const onCreatePostSubmit = (values: UpdatePostInput) => {
		editPost({
			variables: {
				updatePostInput: { ...values, id: router.query.id as string },
			},
		});

		// back to previous page
		router.back();
	};

	if (meLoading || postLoading) {
		return <Spinner />;
	}

	if (!data?.getPost) {
		return (
			<Layout>
				<h1>Post Not Found!</h1>
				<NextLink href='/'>
					<Button>Back to home page</Button>
				</NextLink>
			</Layout>
		);
	}

	const initialValues = {
		text: data.getPost.text,
		title: data.getPost.title,
	};

	if (data.getPost.user.id !== meData?.me?.id) {
		return (
			<Layout>
				<h1>Permission denied!</h1>{' '}
				<NextLink href='/'>
					<Button>back to homepage</Button>
				</NextLink>
			</Layout>
		);
	}

	if (updatePostData?.updatePost.post) {
		router.push(`/post/${router.query.id}`);
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
								Update Post
							</Button>
							<NextLink href='/'>
								<Button>Back to homepage</Button>
							</NextLink>
						</Flex>
					</Form>
				)}
			</Formik>
		</Layout>
	);
};

export default EditPost;
