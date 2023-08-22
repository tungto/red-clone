import { FieldError } from '../generated/graphql';

export const mapFieldErrors = (errors: FieldError[]) => {
	return errors.reduce((accErrorObj, err) => {
		return { ...accErrorObj, [err.field]: err.message };
	}, {});
};
