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
	}, [data, loading, router]);

	return { data, loading };
};

export default useCheckAuth;
