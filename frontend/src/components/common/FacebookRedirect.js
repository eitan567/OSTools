import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function FacebookRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Remove the '_=_' from the URL
    if (window.location.hash === '#_=_') {
      window.history.replaceState(
        null,
        document.title,
        window.location.pathname + window.location.search
      );
    }

    // Fetch user data or perform any other necessary actions
    // Then redirect to the desired page
    navigate('/');
  }, [navigate]);

  return <div>Redirecting...</div>;
}

export default FacebookRedirect;