import {
	FormControl,
	FormErrorMessage,
	FormLabel,
	Input,
	Textarea,
} from '@chakra-ui/react';
import { useField } from 'formik';
import React from 'react';

interface InputFieldProps {
	name: string;
	label: string;
	placeholder: string;
	type: string;
	textarea?: boolean;
}

function InputField(props: InputFieldProps) {
	const [field, { error }] = useField(props);

	return (
		<FormControl isInvalid={!!error}>
			<FormLabel htmlFor={field.name}>{props.label}</FormLabel>
			{!props.textarea ? (
				<Input
					id={field.name}
					onChange={field.onChange}
					value={field.value}
					placeholder={props.placeholder}
					type={props.type}
					// {...props} can use this as shortening
				/>
			) : (
				<Textarea
					id={field.name}
					onChange={field.onChange}
					value={field.value}
					placeholder={props.placeholder}
				/>
			)}

			{error && <FormErrorMessage>{error}</FormErrorMessage>}
		</FormControl>
	);
}

export default InputField;
