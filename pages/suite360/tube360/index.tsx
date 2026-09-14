import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Tube360Index = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/suite360/tube360/start');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <p>Redirecting to Tube360...</p>
    </div>
  );
};

export default Tube360Index;
