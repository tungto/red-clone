import { useRouter } from 'next/router';
import { useMeQuery } from '../generated/graphql';
import { useEffect } from 'react';

const useCheckAuth = () => {
	const router = useRouter();
	const { data, loading } = useMeQuery();

	useEffect(() => {
		if (
			!loading &&
			data?.me &&
			(router.route === '/login' || router.route === '/register')
		) {
			router.push('/');
		}
	}, [data, loading, router]);

	return { data, loading };
};

export default useCheckAuth;
