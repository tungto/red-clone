import React from 'react';
import { Navbar } from './Navbar';
import Wrapper from './Wrapper';

const Layout = ({ children }) => {
	return (
		<>
			<Navbar />
			<Wrapper size='regular'>{children}</Wrapper>
		</>
	);
};

export default Layout;
