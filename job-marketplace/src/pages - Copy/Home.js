import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';  // Importing CSS

const Home = () => {
  const navigate = useNavigate();

  const goToRegister = () => {
    navigate("/register");
  };

  const goToLogin = () => {
    navigate("/verify");
  };

  return (
    <div className="home-container">
      <h2>Welcome to the Web3 DApp</h2>
      <p>Please register or log in to access the platform</p>
      
      <div className="auth-buttons">
        <button onClick={goToRegister} className="auth-btn">
          Register (Sign-Up)
        </button>
        
        <button onClick={goToLogin} className="auth-btn">
          Log In (Verification)
        </button>
      </div>
    </div>
  );
};

export default Home;
