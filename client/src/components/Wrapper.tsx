import { Box } from '@chakra-ui/react';
import React, { ReactNode } from 'react';

interface IWrapperProps {
	children: ReactNode;
	size?: string;
}

const Wrapper = ({ children, size }: IWrapperProps) => {
	return (
		<Box
			maxW={size === 'regular' ? '800px' : '400px'}
			w='100%'
			mt={8}
			mx='auto'>
			{children}
		</Box>
	);
};

export default Wrapper;
