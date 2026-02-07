import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>© Shoppy. Simple e-commerce by Supreeth.</p>
      </footer>
    </div>
  );
}
