import {
	Arg,
	Ctx,
	FieldResolver,
	ID,
	Int,
	Mutation,
	Query,
	Resolver,
	Root,
	UseMiddleware,
	registerEnumType,
} from 'type-graphql';
import { FindManyOptions, LessThan } from 'typeorm';
import { Post } from '../entities/Post';
import { User } from '../entities/User';
import { checkAuth } from '../middleware/checkAuth';
import { CreatePostInput } from '../types/CreatePostInput';
import { PaginatedPosts } from '../types/PaginatedPosts';
import { PostMutationResponse } from '../types/PostMutationResponse';
import { UpdatePostInput } from '../types/UpdatePostInput';
import { Context } from '../types/Context';
import { VoteType } from '../types/VoteType';
import { UserInputError } from 'apollo-server-core';
import { Upvote } from '../entities/Upvote';

registerEnumType(VoteType, {
	name: 'VoteType', // this is mandatory
});

//*field resolvers - https://typegraphql.com/docs/resolvers.html#field-resolvers
@Resolver((_of) => Post)
export class PostResolver {
	@FieldResolver((_return) => String)
	textSnippet(@Root() root: Post) {
		return root.text.slice(0, 100);
	}

	@FieldResolver((_return) => User, { nullable: true })
	async user(
		@Root() root: Post,
		@Ctx() { dataLoaders: { userLoader } }: Context
	) {
		// const user = await User.findOneBy({ id: userId });
		const user = await userLoader.load(root.userId);
		if (!user) {
			return null;
		}
		return user;
	}

	@FieldResolver((_return) => Int)
	async voteType(
		@Root() root: Post,
		@Ctx() { req, dataLoaders: { voteTypeLoader } }: Context
	) {
		// if voted or anonymous user => 0
		// const existingVote = await Upvote.findOne({
		// 	where: {
		// 		userId: req?.session?.userId,
		// 		postId: root.id,
		// 	},
		// });

		const existingVote = await voteTypeLoader.load({
			userId: req.session.userId!,
			postId: root.id,
		});

		if (!existingVote || !req.session.userId) {
			return 0;
		}
		// else => 1

		return existingVote.value;
	}

	/**
	 * CREATE POST
	 * @param param0
	 * @returns POST
	 */
	@Mutation((_return) => PostMutationResponse)
	@UseMiddleware(checkAuth)
	async createPost(
		@Arg('createPostInput') { title, text }: CreatePostInput,
		@Ctx() { req }: Context
	): Promise<PostMutationResponse> {
		try {
			// check if user have permission to create post
			// check if cookie, userId provided

			//1. CREATE and SAVE POST
			const newPost = await Post.create({
				title,
				text,
				userId: req.session.userId,
			}).save();

			return {
				code: 201,
				success: true,
				message: 'CREATE POST SUCCESSFUL!',
				post: newPost,
			};
		} catch (error) {
			console.log(`CREATE POST ERROR: ${error.message}`);
			return {
				code: 500,
				success: false,
				message: `CREATE POST ERROR: ${error.message}`,
				errors: [],
			};
		}
	}

	/**
	 * Get all posts
	 * @returns Posts
	 */
	@Query((_return) => PaginatedPosts, { nullable: true })
	async getPosts(
		@Arg('limit', (_type) => Int) limit: number,
		@Arg('cursor', { nullable: true }) cursor?: Date
	): Promise<PaginatedPosts | null> {
		try {
			const totalPostCount = await Post.count();
			//  query max 100 posts
			const realLimit = Math.min(100, limit);

			// oldest post => createdAt: 2023-08-23T14:57:54.059Z,
			let lastPost: Post = (
				await Post.find({
					order: { createdAt: 'ASC' },
					take: 1,
				})
			)[0];

			const findOptions: FindManyOptions = {
				take: realLimit,
				order: {
					createdAt: 'DESC', // GET THE LATEST FIRST
				},
			};

			if (cursor) {
				// post created earlier than current cursor date
				findOptions.where = { createdAt: LessThan(cursor) };
			}

			const posts = await Post.find(findOptions);

			return {
				paginatedPosts: posts,
				totalCount: totalPostCount,
				hasMore: cursor
					? posts[posts.length - 1].createdAt.toString() !==
					  lastPost.createdAt.toString()
					: posts.length !== totalPostCount,
				// Get the date of the current oldest post fetched on the FE
				cursor: posts[posts.length - 1].createdAt,
			};
		} catch (error) {
			console.log(`ERROR GET POSTS: `, error.message);
			return null;
		}
	}

	/**
	 * Get Single Post
	 * @param id
	 * @returns Post
	 */
	@Query((_return) => Post, { nullable: true })
	async getPost(@Arg('id', (_type) => ID) id: number): Promise<Post | null> {
		try {
			const post = await Post.findOneBy({ id });

			if (post) {
				return post;
			}
			return null;
		} catch (error) {
			console.log(`ERROR GET POST: `, error.message);
			return null;
		}
	}

	/**
	 * UPDATE POST
	 * @param param0
	 * @returns Post
	 */
	@Mutation((_return) => PostMutationResponse, { nullable: true })
	@UseMiddleware(checkAuth)
	async updatePost(
		@Arg('updatePostInput') { id, title, text }: UpdatePostInput,
		@Ctx() { req }: Context
	): Promise<PostMutationResponse | null> {
		try {
			const existingPost = await Post.findOne({ where: { id } });

			if (existingPost?.userId !== req.session.userId) {
				return {
					code: 401,
					success: false,
					message: 'YOU DO NOT HAVE PERMISSION TO EDIT THIS POST',
					errors: [],
				};
			}

			//1. Check if post existing in
			if (existingPost) {
				existingPost.title = title;
				existingPost.text = text;

				await existingPost.save();

				return {
					code: 200,
					success: true,
					message: 'UPDATE POST SUCCESSFUL!',
					post: existingPost,
				};
			}

			// IF NO POST FOUND
			return {
				code: 404,
				success: false,
				message: 'THERE IS NO POST WITH GIVEN ID, TRY ANOTHER ONE!',
				errors: [],
			};

			//2. validate and update post
		} catch (error) {
			console.log(`ERROR UPDATE POST:`, error.message);
			return {
				code: 500,
				success: false,
				message: 'sth went wrong',
				errors: [],
			};
		}
	}

	/**
	 * DELETE POST
	 * @param id
	 * @returns PostMutationResponse
	 */
	@Mutation((_return) => PostMutationResponse, { nullable: true })
	@UseMiddleware(checkAuth)
	async deletePost(
		@Arg('id', (_type) => ID) id: number,
		@Ctx() { req }: Context
	): Promise<PostMutationResponse | null> {
		try {
			const existingPost = await Post.findOneBy({ id });

			if (existingPost?.userId !== req.session.userId) {
				return {
					code: 401,
					success: false,
					message: 'YOU DO NOT HAVE PERMISSION TO EDIT THIS POST',
					errors: [],
				};
			}

			if (existingPost) {
				await Post.delete(id);

				return {
					code: 200,
					success: true,
					message: `DELETE POST ID: ${id} SUCCESS`,
					post: undefined,
				};
			}

			return {
				code: 400,
				success: false,
				message: `THERE IS NO POST WITH GIVEN ID`,
			};
		} catch (error) {
			console.log(`DELETE POST FAILED: `, error.message);
			return {
				code: 500,
				success: false,
				message: `DELETE POST ID: ${id} FAILED`,
			};
		}
	}

	@Mutation((_return) => PostMutationResponse)
	@UseMiddleware(checkAuth)
	async vote(
		@Arg('postId', (_type) => Int) postId: number,
		@Arg('inputVoteValue', (_type) => VoteType) inputVoteValue: VoteType,
		@Ctx() { req, connection }: Context
	): Promise<PostMutationResponse> {
		// use transaction of typeorm for complex operation to catch error and rollback data

		return await connection.transaction(
			async (transactionEntityManager) => {
				// check if post exists
				let post = await transactionEntityManager.findOne(Post, {
					where: { id: postId },
				});

				if (!post) {
					throw new UserInputError('Post Not found');
				}

				// check if user voted or not
				const existingVote = await transactionEntityManager.findOne(
					Upvote,
					{ where: { postId: postId, userId: req.session.userId } }
				);

				if (existingVote && existingVote.value !== inputVoteValue) {
					await transactionEntityManager.save(Upvote, {
						...existingVote,
						value: inputVoteValue,
					});

					post = await transactionEntityManager.save(Post, {
						...post,
						points: post.points + 2 * inputVoteValue,
					});
				}

				// if not vote
				if (!existingVote) {
					const newVote = transactionEntityManager.create(Upvote, {
						userId: req.session.userId,
						postId,
						value: inputVoteValue,
					});

					await transactionEntityManager.save(newVote);

					post.points = post.points + inputVoteValue;
					post = await transactionEntityManager.save(post);
				}

				return {
					code: 200,
					success: true,
					message: 'Post voted',
					post,
				};
			}
		);
	}
}
