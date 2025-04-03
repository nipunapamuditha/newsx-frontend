import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  
  return (
    <AppBar position="fixed" sx={{ bgcolor: 'white', color: 'black' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          MyApp
        </Typography>
        <Box>
          <Button 
            component={Link} 
            to="/profile"
            color="inherit"
            sx={{ 
              mx: 1,
              borderBottom: location.pathname === '/profile' ? 2 : 0,
              borderColor: 'primary.main'
            }}
          >
            Profile
          </Button>
          <Button 
            component={Link} 
            to="/dashboard"
            color="inherit"
            sx={{ 
              mx: 1,
              borderBottom: location.pathname === '/dashboard' ? 2 : 0,
              borderColor: 'primary.main'
            }}
          >
            Dashboard
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;