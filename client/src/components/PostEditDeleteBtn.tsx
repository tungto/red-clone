import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Box, IconButton } from '@chakra-ui/react';
import React from 'react';

const PostEditDeleteBtn = ({ postId }) => {
	const onEditPost = () => {
		console.log(postId);
	};
	const onDeletePost = () => {
		console.log(postId);
	};

	return (
		<Box>
			<IconButton
				icon={<DeleteIcon />}
				aria-label='Delete'
				mr={4}
				onClick={onDeletePost}
			/>
			<IconButton
				icon={<EditIcon />}
				aria-label='Edit'
				mr={4}
				onClick={onEditPost}
			/>
		</Box>
	);
};

export default PostEditDeleteBtn;
