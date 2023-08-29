import {
	Arg,
	FieldResolver,
	ID,
	Mutation,
	Query,
	Resolver,
	Root,
	UseMiddleware,
} from 'type-graphql';
import { Post } from '../entities/Post';
import { checkAuth } from '../middleware/checkAuth';
import { CreatePostInput } from '../types/CreatePostInput';
import { PostMutationResponse } from '../types/PostMutationResponse';
import { UpdatePostInput } from '../types/UpdatePostInput';
import { User } from '../entities/User';

//*field resolvers - https://typegraphql.com/docs/resolvers.html#field-resolvers
@Resolver((_of) => Post)
export class PostResolver {
	@FieldResolver((_return) => String)
	textSnippet(@Root() root: Post) {
		return root.text.slice(0, 100);
	}

	@FieldResolver((_return) => User, { nullable: true })
	async user(@Root() root: Post) {
		const userId = root.userId;

		const user = await User.findOneBy({ id: userId });

		if (!user) {
			return null;
		}

		return user;
	}

	/**
	 * CREATE POST
	 * @param param0
	 * @returns POST
	 */
	@Mutation((_returns) => PostMutationResponse)
	@UseMiddleware(checkAuth)
	async createPost(
		@Arg('createPostInput') { title, text, userId }: CreatePostInput
	): Promise<PostMutationResponse> {
		try {
			// check if user have permission to create post
			// check if cookie, userId provided

			//1. CREATE and SAVE POST
			const newPost = await Post.create({ title, text, userId }).save();

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
	@Query((_return) => [Post], { nullable: true })
	async getPosts(): Promise<Post[] | null> {
		try {
			return await Post.find();
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
			console.log('======');
			console.log(id);
			const post = await Post.findOneBy({ id });

			if (post) {
				console.log('================================');
				console.log(post);
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
		@Arg('updatePostInput') { id, title, text }: UpdatePostInput
	): Promise<PostMutationResponse | null> {
		try {
			const existingPost = await Post.findOne({ where: { id } });

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
		@Arg('id') id: number
	): Promise<PostMutationResponse | null> {
		try {
			const existingPost = await Post.findOneBy({ id });

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
}
