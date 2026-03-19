import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { captureTrafficSource } from './utils/trafficSource';

export default function App() {
  useEffect(() => { captureTrafficSource(); }, []);
  return <RouterProvider router={router} />;
}
