import {
	FormControl,
	FormErrorMessage,
	FormLabel,
	Input,
} from '@chakra-ui/react';
import { useField } from 'formik';
import React from 'react';

interface InputFieldProps {
	name: string;
	label: string;
	placeholder: string;
	type: string;
}

function InputField(props: InputFieldProps) {
	const [field, { error }] = useField(props);

	return (
		<FormControl isInvalid={!!error}>
			<FormLabel htmlFor={field.name}>{props.label}</FormLabel>
			<Input
				id={field.name}
				onChange={field.onChange}
				value={field.value}
				placeholder={props.placeholder}
				type={props.type}
				// {...props} can use this as shortening
			/>
			{error && <FormErrorMessage>{error}</FormErrorMessage>}
		</FormControl>
	);
}

export default InputField;
