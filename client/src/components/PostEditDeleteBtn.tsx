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

export type PostsCacheObject = Pick<
	PaginatedPosts,
	'__typename' | 'cursor' | 'hasMore' | 'totalCount'
> & {
	paginatedPosts: Reference[];
};

const PostEditDeleteBtn = ({ postId, userId }) => {
	const [deletePost, {}] = useDeletePostMutation();
	const { data: meData } = useMeQuery();
	const router = useRouter();

	const onDeletePost = async () => {
		await deletePost({
			variables: { id: postId },
			update(cache, { data }) {
				if (data?.deletePost.success) {
					// * using modify instead of query new data
					// cache.writeQuery<PostsQuery>({
					// 	query: PostsDocument,
					// 	data: {
					// 		getPosts: postsData.getPosts,
					// 	},
					// });

					cache.modify({
						fields: {
							getPosts(existing: PostsCacheObject) {
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

	if (meData?.me?.id !== userId) {
		return null;
	}

	return (
		<Box>
			<NextLink href={`/post/edit/${postId}`}>
				<IconButton icon={<EditIcon />} aria-label='Edit' mr={4} />
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
