import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Blog Platform
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/" className="text-gray-700 hover:text-blue-600">
                  Home
                </Link>
                <Link to="/create-post" className="text-gray-700 hover:text-blue-600">
                  Create Post
                </Link>
                {isAdmin() && (
                  <Link to="/admin" className="text-gray-700 hover:text-blue-600 font-semibold">
                    Admin Panel
                  </Link>
                )}
                <Link to="/profile" className="text-gray-700 hover:text-blue-600">
                  Profile
                </Link>
                <span className="text-gray-600">
                  {user.username} {user.role === 'admin' && '(Admin)'}
                </span>
                <button onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
