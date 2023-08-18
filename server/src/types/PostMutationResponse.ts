import { Field, ObjectType } from 'type-graphql';
import { IMutationResponse } from './MutationResponse';
import { Post } from 'src/entities/Post';
import { FieldError } from './FieldError';

@ObjectType({ implements: IMutationResponse })
export class PostMutationResponse extends IMutationResponse {
	code: number;
	success: boolean;
	message?: string;

	@Field()
	post?: Post;

	@Field((_type) => [FieldError], { nullable: true })
	errors: FieldError[];
}
