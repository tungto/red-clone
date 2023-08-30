import { Field, ID, ObjectType } from 'type-graphql';
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

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
	@Field()
	@ManyToMany(() => User, (user) => user.posts)
	user: User;

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
