import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import { useState } from 'react';
import {
	PostWithUserInfoFragment,
	VoteType,
	useVoteMutation,
} from '../generated/graphql';

interface UpVoteSectionProps {
	post: PostWithUserInfoFragment;
}

const UpVoteSection = ({ post }: UpVoteSectionProps) => {
	const [votePost, {}] = useVoteMutation();

	const [voteLoading, setvoteLoading] = useState<
		'upvoteLoading' | 'downvoteLoading' | 'notLoading'
	>('notLoading');

	enum VoteTypeValues {
		UpVote = 1,

		DownVote = -1,
	}

	const onVote = async (values: VoteType) => {
		// Only vote up/down only 1 time
		if (
			(values === VoteType.Upvote &&
				post.voteType === VoteTypeValues.UpVote) ||
			(values === VoteType.Downvote &&
				post.voteType === VoteTypeValues.DownVote)
		) {
			return;
		}

		setvoteLoading(
			values === VoteType.Upvote ? 'upvoteLoading' : 'downvoteLoading'
		);

		await votePost({
			variables: {
				postId: +post.id,
				inputVoteValue: values,
			},
		});

		setvoteLoading('notLoading');
	};

	return (
		<Flex direction='column' align='center' mr={4}>
			<IconButton
				icon={<ChevronUpIcon />}
				aria-label='upvote'
				onClick={() => onVote(VoteType.Upvote)}
				isLoading={voteLoading === 'upvoteLoading'}
				colorScheme={
					post.voteType === VoteTypeValues.UpVote
						? 'green'
						: undefined
				}
			/>
			{post.points}
			<IconButton
				icon={<ChevronDownIcon />}
				aria-label='downvote'
				onClick={() => onVote(VoteType.Downvote)}
				isLoading={voteLoading === 'downvoteLoading'}
				colorScheme={
					post.voteType === VoteTypeValues.DownVote
						? 'red'
						: undefined
				}
			/>
		</Flex>
	);
};

export default UpVoteSection;
