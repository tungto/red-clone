import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from './Post';
import { User } from './User';

@Entity()
export class Upvote extends BaseEntity {
	@PrimaryColumn()
	userId!: number;

	@PrimaryColumn()
	postId!: number;

	@ManyToOne((_to) => Post, (post) => post.upVotes)
	post: Post;

	@ManyToOne((_to) => User, (user) => user.upVotes)
	user: User;

	@Column()
	value!: number;
}
