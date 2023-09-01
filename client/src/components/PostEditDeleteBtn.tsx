import { Reference } from '@apollo/client';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Box, IconButton } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import {
	PaginatedPosts,
	useDeletePostMutation,
	useMeQuery,
} from '../generated/graphql';

const PostEditDeleteBtn = ({ postId, userId }) => {
	const [deletePost, {}] = useDeletePostMutation();

	const router = useRouter();

	const onEditPost = () => {};

	const onDeletePost = async () => {
		await deletePost({
			variables: { id: postId },
			update(cache, { data }) {
				if (data?.deletePost.success) {
					// cache.writeQuery<PostsQuery>({
					// 	query: PostsDocument,
					// 	data: {
					// 		getPosts: postsData.getPosts,
					// 	},
					// });

					cache.modify({
						fields: {
							getPosts(
								existing: Pick<
									PaginatedPosts,
									| '__typename'
									| 'cursor'
									| 'hasMore'
									| 'totalCount'
								> & {
									paginatedPosts: Reference[];
								}
							) {
								const newPostsAfterDeletion = {
									...existing,
									totalCount: existing.totalCount - 1,
									paginatedPosts:
										existing.paginatedPosts.filter(
											(postRefObject) => {
												return (
													postRefObject.__ref !==
													`Post:${postId}`
												);
											}
										),
								};

								return newPostsAfterDeletion;
							},
						},
					});
				}
			},
		});

		if (router.route !== '/') router.push('/');
	};

	const { data: meData } = useMeQuery();

	if (meData?.me?.id !== userId) {
		return null;
	}

	return (
		<Box>
			<NextLink href={`/post/edit/${postId}`}>
				<IconButton
					icon={<EditIcon />}
					aria-label='Edit'
					mr={4}
					onClick={onEditPost}
				/>
			</NextLink>

			<IconButton
				icon={<DeleteIcon />}
				aria-label='Delete'
				mr={4}
				colorScheme='red'
				onClick={onDeletePost}
			/>
		</Box>
	);
};

export default PostEditDeleteBtn;
