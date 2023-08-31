import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useMeQuery } from '../generated/graphql';

const useCheckAuth = () => {
	const router = useRouter();
	const { data, loading } = useMeQuery();

	useEffect(() => {
		if (
			!loading &&
			data?.me &&
			(router.route === '/login' ||
				router.route === '/register' ||
				router.route === '/forgot-password' ||
				router.route === '/reset-password')
		) {
			router.push('/');
		}

		// if user not login yet, route to login page
		if (!loading && !data?.me && router.route === '/create-post') {
			router.push('/login');
		}
	}, [data, loading, router]);

	return { data, loading };
};

export default useCheckAuth;
