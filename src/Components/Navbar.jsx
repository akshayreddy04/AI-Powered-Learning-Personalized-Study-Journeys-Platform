import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applogo, logout, getAuthToken } from '../Constants'; // Added getAuthToken

const Navbar = () => {
  const navigate = useNavigate();
  const [navlinks, setNavlinks] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authToken = getAuthToken();
    setIsAuthenticated(!!authToken);
  }, []);

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    navigate('/auth');
  };

  const togglenav = () => {
    setNavlinks(!navlinks);
  };

  return (
    <header>
      <nav className="bg-white border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          <Link to="/" className="flex items-center">
            <img src={applogo} className="mr-3 h-6 sm:h-9" alt="FocusLearn Logo" />
            <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">FocusLearn</span>
          </Link>
          <div className="flex items-center lg:order-2">
            <button
              data-collapse-toggle="mobile-menu-2"
              onClick={togglenav}
              type="button"
              className="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              aria-controls="mobile-menu-2"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
              </svg>
              <svg className="hidden w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
          <div className={`${navlinks ? '' : 'hidden'} justify-between items-center w-full lg:flex lg:w-auto lg:order-1`} id="mobile-menu-2">
            <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
              <li>
                <Link to="/" className="block py-2 pr-4 pl-3 text-white rounded bg-primary-700 lg:bg-transparent lg:text-primary-700 lg:p-0 dark:text-white" aria-current="page">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/explore" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">
                  Explore
                </Link>
              </li>
              <li>
                <Link to="/profile" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">
                  Profile
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li>
                    <Link to="/teacher-notes" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">
                      Teacher Notes
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="block py-2 pr-4 pb-1 pl-3 text-red-300 border-b border-gray-100 hover:bg-gray-500 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700  dark:text-red-400 lg:dark:hover:text-white dark:hover:bg-red-700 dark:p-1 dark:hover:text-white lg:dark:hover:bg-red-400 dark:border-gray-700 rounded-md">
                      Logout
                    </button>
                  </li>
                </>
              )}
              {!isAuthenticated && (
                <li>
                  <Link to="/auth" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;