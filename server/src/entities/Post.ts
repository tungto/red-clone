import { Field, ID, ObjectType } from 'type-graphql';
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';
import { Upvote } from './Upvote';

// turn entity to object type
@ObjectType()
@Entity()
export class Post extends BaseEntity {
	@Field((_type) => ID)
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column({ unique: true })
	title!: string;

	@Field((_type) => ID)
	@Column()
	userId!: number;

	//https://orkhan.gitbook.io/typeorm/docs/many-to-one-one-to-many-relations
	@Field((_type) => User)
	@ManyToOne(() => User, (user) => user.posts)
	user: User;

	//Check if current user voted or not
	@Field()
	voteType!: number;

	@OneToMany((_to) => Upvote, (upvote) => upvote.post)
	upVotes: Upvote[];

	@Field()
	@Column({ default: 0 })
	points!: number;

	@Field()
	@Column()
	text!: string;

	@Field()
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date;

	@Field()
	@CreateDateColumn({ type: 'timestamptz' })
	updatedAt: Date;
}
