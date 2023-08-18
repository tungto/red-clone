import * as argon2 from 'argon2';
import { Arg, Mutation, Resolver } from 'type-graphql';
import { User } from '../entities/User';

@Resolver()
export class PostResolver {
	@Mutation((_returns) => User, { nullable: true })
	async register(
		@Arg('email') email: string,
		@Arg('username') username: string,
		@Arg('password') password: string
	) {
		try {
			const existingUser = await User.findOne({ where: { username } });

			if (existingUser) {
				return null;
			}

			const hashedPassword = await argon2.hash(password);
			const newUser = User.create({
				username,
				password: hashedPassword,
				email,
			});

			return await User.save(newUser);
		} catch (error) {
			console.log(error);
			return null;
		}
	}
}
