import { RegisterInput } from '../types/RegisterInput';

export const validateRegisterInput = (input: RegisterInput) => {
	if (!input.email.includes('@')) {
		return {
			message: 'Email invalid',
			errors: [
				{ field: 'email', message: 'email should include @ symbol' },
			],
		};
	}

	// check username length
	if (input.username.length < 3) {
		return {
			message: 'username should more than 8 chars',
			errors: [
				{
					field: 'username',
					message: 'username should more than 8 chars',
				},
			],
		};
	}

	if (input.username.includes('@')) {
		return {
			message: 'username should not includes @ symbol',
			errors: [
				{
					field: 'username',
					message: 'username should not includes @ symbol',
				},
			],
		};
	}

	// check password length
	if (input.password.length < 3) {
		return {
			message: 'password should more than 8 chars',
			errors: [
				{
					field: 'password',
					message: 'password should more than 8 chars',
				},
			],
		};
	}

	return null;
};
