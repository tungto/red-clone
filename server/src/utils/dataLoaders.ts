import DataLoader from 'dataloader';
import { User } from '../entities/User';
import { In } from 'typeorm';
import { Upvote } from '../entities/Upvote';

interface VoteTypeCondition {
	userId: number;
	postId: number;
}

const batchGetUsers = async (userIds: number[]) => {
	const users = await User.findBy({ id: In(userIds) });
	return userIds.map((userId) => {
		return users.find((user) => user.id === userId);
	});
};

const batchGetVoteType = async (voteTypeConditions: VoteTypeCondition[]) => {
	const voteTypes = await Upvote.find({ where: voteTypeConditions });

	return voteTypeConditions.map((voteTypeCon) => {
		return voteTypes.find(
			(voteType) =>
				voteType.userId === voteTypeCon.userId &&
				voteType.postId === voteTypeCon.postId
		);
	});
};

export const buildDataLoaders = () => ({
	userLoader: new DataLoader<number, User | undefined>((userIds) => {
		return batchGetUsers(userIds as number[]);
	}),

	voteTypeLoader: new DataLoader<VoteTypeCondition, Upvote | undefined>(
		(voteTypeConditions) => {
			return batchGetVoteType(voteTypeConditions as VoteTypeCondition[]);
		}
	),
});
