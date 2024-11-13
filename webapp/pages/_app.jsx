import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Check authentication on route change
    const handleRouteChange = (url) => {
      const token = localStorage.getItem('token');
      if (!token && url !== '/login') {
        router.push('/login');
      }
    };

    // Check initial route
    handleRouteChange(router.pathname);

    // Listen for route changes
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
