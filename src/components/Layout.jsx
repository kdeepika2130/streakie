import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

function Layout() {
  try {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16">
          <Outlet />
        </main>
        <Footer />
  <Toaster position="bottom-right" />
      </div>
    );
  } catch (error) {
    console.error('Layout.jsx: Render error:', error);
    return <div>Error rendering layout. Please try refreshing the page.</div>;
  }
}

export default Layout;