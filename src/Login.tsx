import { CSSProperties } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const styles: Record<string, CSSProperties> = {
    loginPage: {
      height: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
    },
    loginContainer: {
      width: '100%',
      maxWidth: '450px',
      padding: '20px',
    },
    loginCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
      padding: '40px 30px',
      textAlign: 'center',
      transition: 'transform 0.3s ease',
    },
    appTitle: {
      fontSize: '36px',
      fontWeight: 'bold',
      marginBottom: '10px',
      letterSpacing: '2px',
      color: '#000000',
    },
    xHighlight: {
      color: '#1a73e8',
      fontWeight: 'bold',
    },
    loginSubtitle: {
      color: '#5f6368',
      marginBottom: '30px',
      fontSize: '16px',
    },
    googleLoginWrapper: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '20px',
    }
  };

  const navigate = useNavigate();
  const handleLoginSuccess = async (response: any) => {
    console.log('login sucess')
    console.log(response)
    try {
      const apiResponse = await axios.post('https://newsxapi.newsloop.xyz/v1/signuporlogin', {
        Token: response.credential
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('API Response:', apiResponse.data);
      if(apiResponse.data.existing_user === 1) {
        console.log('Welcome back! Existing user logged in');
        navigate('/dashboard');
      }
      else if (apiResponse.data.existing_user == 0){
        console.log('Welcome back! Existing user logged in');
        navigate('/profile');
      }
      
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  const handleLoginFailure = () => {
    console.log('Login Failed');
  };

  return (
    <div style={styles.loginPage}>
      <GoogleOAuthProvider clientId="703147247871-6882ps6omirmnqkbva1ph4cc941qifd9.apps.googleusercontent.com">
        <div style={styles.loginContainer}>
          <div style={styles.loginCard}>
            <h1 style={styles.appTitle}>
              NEW<span style={styles.xHighlight}>X</span>
            </h1>
            <p style={styles.loginSubtitle}>Sign in to continue</p>
            <div style={styles.googleLoginWrapper}>
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginFailure}
                useOneTap
                shape="pill"
                theme="filled_blue"
              />
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    </div>
  );
};

export default Login;