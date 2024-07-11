import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToHome = ({ children }) => {
    const location = useLocation();

    useEffect(() => {
        const hash = location.hash;
        if (hash) {
            const element = document.querySelector(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location]);

    return children;
};

export default ScrollToHome;
