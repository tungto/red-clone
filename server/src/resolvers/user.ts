import * as argon2 from 'argon2';
import { Arg, Ctx, Mutation, Resolver } from 'type-graphql';
import { User } from '../entities/User';
import { UserMutationResponse } from '../types/UserMutationResponse';
import { RegisterInput } from '../types/RegisterInput';
import { validateRegisterInput } from '../utils/validateRegisterInput';
import { LoginInput } from '../types/LoginInput';
import { Context } from '../types/Context';
import { COOKIE_NAME } from '../constants';

@Resolver()
export class UserResolver {
	/**
	 * SIGN UP
	 * @param registerInput
	 * @returns
	 */
	@Mutation((_returns) => UserMutationResponse, { nullable: true })
	async register(
		@Arg('registerInput') registerInput: RegisterInput,
		@Ctx() { req }: Context
	): Promise<UserMutationResponse> {
		try {
			//1. Validate inputs
			const validateRegisterInputErrors =
				validateRegisterInput(registerInput);

			if (validateRegisterInputErrors) {
				return {
					code: 400,
					success: false,
					errors: validateRegisterInputErrors.errors,
				};
			}
			const { email, username, password } = registerInput;
			// validate input

			// 2. Check if user, email already registered
			const existingUser = await User.findOne({
				where: [{ username }, { email }],
			});

			if (existingUser) {
				console.log('User already exist');

				return {
					code: 400,
					success: false,
					message: 'User already exists',
					errors: [
						{
							field:
								existingUser.username == username
									? 'username'
									: 'email',
							message: `${
								existingUser.username === username
									? 'username'
									: 'email'
							} already in use`,
						},
					],
				};
			}
			//3. Hashing password, create and return new user
			const hashedPassword = await argon2.hash(password);
			let newUser = User.create({
				username,
				password: hashedPassword,
				email,
			});

			newUser = await User.save(newUser);

			// ATTACH COOKIE TO REQ
			req.session.userId = newUser.id;

			return {
				user: newUser,
				code: 201,
				success: true,
				message: 'User saved successfully',
			};
		} catch (error) {
			console.log('REGISTER ERROR: ', error);
			return {
				code: 500,
				success: false,
				message: `Internal server error ${error.message}`,
			};
		}
	}

	/**
	 * LOGIN
	 * @param loginInput
	 * @returns
	 */
	@Mutation((_returns) => UserMutationResponse)
	async login(
		@Arg('loginInput') loginInput: LoginInput,
		@Ctx() { req }: Context
	): Promise<UserMutationResponse> {
		try {
			//1. check if user existing
			const existingUser = await User.findOne({
				where: { email: loginInput.email },
			});

			if (!existingUser) {
				return {
					success: false,
					code: 404,
					message: 'Incorrect username or password',
					errors: [
						{
							field: 'email',
							message: `Invalid email`,
						},
					],
				};
			}

			//2. check password
			const isPwCorrect = await argon2.verify(
				existingUser.password,
				loginInput.password
			);

			if (!isPwCorrect) {
				return {
					success: false,
					code: 404,
					message: 'Incorrect username or password',
					errors: [
						{ field: 'password', message: 'invalid password' },
					],
				};
			}

			//3. CREATE SESSION AND RETURN COOKIE
			req.session.userId = existingUser.id;

			console.log('================================');
			console.log(req.session);

			return {
				success: true,
				code: 200,
				user: existingUser,
				message: 'Login successfully!',
			};
		} catch (error) {
			return {
				code: 500,
				message: `Internal server error ${error.message}`,
				success: false,
			};
		}
	}

	/**
	 * LOG OUT
	 * @param param0
	 * @returns boolean
	 */
	@Mutation((_returns) => Boolean)
	async logout(@Ctx() { req, res }: Context): Promise<boolean> {
		// 1. Clear cookie
		res.clearCookie(COOKIE_NAME);

		// 2. Destroy session
		const destroyResult = (await new Promise((resolve, _reject) => {
			req.session.destroy((err) => {
				if (err) {
					console.log(`DESTROYING SESSION ERROR`, err);
					resolve(false);
				}
				resolve(true);
			});
		})) as unknown as boolean;

		return destroyResult;
	}
}
