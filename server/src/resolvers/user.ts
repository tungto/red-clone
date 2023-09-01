import * as argon2 from 'argon2';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
	Arg,
	Ctx,
	FieldResolver,
	Mutation,
	Query,
	Resolver,
	Root,
} from 'type-graphql';
import { COOKIE_NAME } from '../constants';
import { User } from '../entities/User';
import { TokenModel } from '../models/Token';
import { Context } from '../types/Context';
import { ForgotPasswordInput } from '../types/ForgotPasswordInput';
import { LoginInput } from '../types/LoginInput';
import { RegisterInput } from '../types/RegisterInput';
import { ResetPasswordInput } from '../types/ResetPasswordInput';
import { UserMutationResponse } from '../types/UserMutationResponse';
import sendEmail, { INodeMailerInfo } from '../utils/sendEmail';
import { validateRegisterInput } from '../utils/validateRegisterInput';
import { Post } from '../entities/Post';

@Resolver((_of) => User)
export class UserResolver {
	@FieldResolver((_return) => [Post])
	async posts(@Root() root: User) {
		const posts = await Post.findBy({ userId: root.id });

		return posts;
	}

	// just show email of the current user and hide other users email
	@FieldResolver((_return) => String)
	async email(@Root() root: User, @Ctx() { req }: Context) {
		return root.id === req.session.userId ? root.email : '';
	}

	@Query((_return) => User, { nullable: true })
	async me(@Ctx() { req }: Context): Promise<User | undefined | null> {
		if (!req.session.userId) {
			return null;
		}

		const user = await User.findOneBy({ id: req.session.userId });

		return user;
	}

	/**
	 * SIGN UP
	 * @param registerInput
	 * @returns
	 */
	@Mutation((_return) => UserMutationResponse, { nullable: true })
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

			newUser = await newUser.save();

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
	@Mutation((_return) => UserMutationResponse)
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
	@Mutation((_return) => Boolean)
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

	/**
	 * Forgot password
	 * @param forgotPwInput
	 * @returns
	 */
	@Mutation((_return) => Boolean)
	async forgotPassword(
		@Arg('forgotPwInput') forgotPwInput: ForgotPasswordInput
	): Promise<Boolean> {
		try {
			// check if email is valid
			const user = await User.findOneBy({ email: forgotPwInput.email });
			const bcryptSalt = 9;

			if (!user) {
				return true;
			}

			// * delete all existing tokens with same userId before save and send new one
			await TokenModel.deleteMany({ userId: `${user.id}` });

			// create reset token
			const resetToken = randomBytes(32).toString('hex');

			/**
			 * compare argon2 vs bcrypt for hashing
			 * https://stytch.com/blog/argon2-vs-bcrypt-vs-scrypt/#:~:text=Argon2%20is%20a%20great%20memory,%2C%20CPU%2C%20or%20memory%20hardness.
			 */
			const hashedToken = await bcrypt.hash(
				resetToken,
				Number(bcryptSalt)
			);

			// save token to mongodb
			const token = new TokenModel({
				userId: `${user.id}`,
				token: hashedToken,
			});

			await token.save();

			// create reset pw link

			const mailOptions: INodeMailerInfo = {
				from: 'toxtung@gmail.com',
				to: forgotPwInput.email,
				subject: 'Forgot Password Reset',
				html: `Hi ${forgotPwInput.email} - click here to reset password: 
					   <a href="http://localhost:3000/reset-password?token=${resetToken}&userId=${user.id}">Click here</a>`,
			};

			// send reset pw to email
			await sendEmail(mailOptions);
			return true;
		} catch (error) {
			console.log(`ERROR RESET PASSWORD ${error.message}`);

			return false;
		}
	}

	/**
	 * Reset password
	 * @param param0
	 * @param token
	 * @param userId
	 * @param resetPwInput
	 * @returns
	 */
	@Mutation((_return) => UserMutationResponse)
	async resetPassword(
		@Ctx() { req }: Context,
		@Arg('token') token: string,
		@Arg('userId') userId: string,
		@Arg('resetPwInput') resetPwInput: ResetPasswordInput
	): Promise<UserMutationResponse> {
		if (resetPwInput.password.length <= 2) {
			return {
				code: 400,
				success: false,
				message: 'Invalid pw',
				errors: [
					{
						field: 'password',
						message: 'Length must be greater than 2',
					},
				],
			};
		}

		try {
			// * All tokens with same userId was deleted before save new one
			// * So we can make sure resetToken here always have only 1 value
			const hashedResetToken = await TokenModel.findOne({ userId });

			if (!hashedResetToken) {
				return {
					code: 400,
					success: false,
					message: 'Invalid token',
					errors: [
						{
							field: 'token',
							message: 'Invalid or expired password reset token',
						},
					],
				};
			}

			// validate token - plain token - hashed token
			const validToken = await bcrypt.compare(
				token,
				hashedResetToken.token
			);

			if (!validToken) {
				return {
					code: 400,
					success: false,
					message: 'Invalid token',
					errors: [
						{
							field: 'token',
							message: 'Tokens are not match',
						},
					],
				};
			}

			console.log('userId', userId);
			console.log('validToken', validToken);

			// check if userId valid
			const user = await User.findOneBy({ id: +userId });

			if (!user) {
				return {
					code: 400,
					success: false,
					message: 'Invalid user id',
					errors: [
						{
							field: 'token',
							message: 'userId does not exist',
						},
					],
				};
			}

			// if token valid => save password
			const hashedPw = await argon2.hash(resetPwInput.password);
			user.password = hashedPw;
			await user.save();

			// delete hashedResetToken after reset pw success
			hashedResetToken.deleteOne();

			// log user in
			req.session.userId = user.id;

			return {
				code: 200,
				success: true,
				message: 'update password success!!',
				user,
			};
		} catch (error) {
			console.log(`RESET PASSWORD ERROR: ${error.message}`);
			return {
				code: 500,
				message: `Internal server error ${error.message}`,
				success: false,
			};
		}
	}
}
