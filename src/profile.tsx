import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Paper,
  Grid,
  TextField,
  Avatar,
  IconButton,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import newsxLogo from '/newxlogo.png';

interface User {
  first_name: string;
  last_name: string;
  email: string;
  unique_id: string;
}

interface SelectedItem {
  id: string;
  name: string;
  isAutoFilled?: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('profile');
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('https://newsxapi.newsloop.xyz/v1/getuser', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchExistingPreferences = async () => {
      try {
        const response = await fetch('https://newsxapi.newsloop.xyz/v1/Get_Preferances', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const autoFilledItems = data.usernames.map((username: string) => ({
            id: `auto-${username}`,
            name: username,
            isAutoFilled: true
          }));
          setSelectedItems(autoFilledItems);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };

    fetchExistingPreferences();
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    navigate(`/${page}`);
  };

  const handleSearch = async () => {
    if (!searchTerm) return;
    
    try {
      const response = await fetch('https://newsxapi.newsloop.xyz/v1/getTwUsernames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tw_user_name: searchTerm }),
      });

      if (response.status === 200) {
        const data = await response.json();
        setSelectedItems([...selectedItems, { 
          id: data.id, 
          name: searchTerm,
          isAutoFilled: false 
        }]);
        setSearchTerm('');
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleSubmitSelections = async () => {
    try {
      const usernames = selectedItems.map(item => item.name);
  
      const response = await fetch('https://newsxapi.newsloop.xyz/v1/publish-preferances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ usernames }),
      });
  
      if (response.ok) {
        // Fetch updated preferences after successful submission
        const preferencesResponse = await fetch('https://newsxapi.newsloop.xyz/v1/Get_Preferances', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
  
        if (preferencesResponse.ok) {
          const data = await preferencesResponse.json();
          const autoFilledItems = data.usernames.map((username: string) => ({
            id: `auto-${username}`,
            name: username,
            isAutoFilled: true
          }));
          setSelectedItems(autoFilledItems);
        }
      }
    } catch (error) {
      console.error('Error submitting selections:', error);
    }
  };

  const removeSelection = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f8ff' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#1976d2', boxShadow: 2 }}>
        <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
  <img 
    src={newsxLogo} 
    alt="NEWSX Logo" 
    style={{ 
      height: '32px', // Adjust height as needed
      width: 'auto'
    }} 
  />
</Box>
          <Button
            startIcon={<PersonIcon />}
            onClick={() => handleNavigate('profile')}
            sx={{
              color: 'white',
              borderBottom: currentPage === 'profile' ? 2 : 0,
              borderColor: 'white',
              mx: 1,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Profile
          </Button>
          <Button
            startIcon={<DashboardIcon />}
            onClick={() => handleNavigate('dashboard')}
            sx={{
              color: 'white',
              borderBottom: currentPage === 'dashboard' ? 2 : 0,
              borderColor: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
        {currentPage === 'profile' ? (
          <Container maxWidth="xl" sx={{ height: '100%' }}>
            <Grid container spacing={4}>
              {/* Profile Header */}
              <Grid item xs={12}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    mb: 2, 
                    bgcolor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: '#1976d2',
                    }}
                  >
                    <AccountCircleIcon sx={{ fontSize: 60 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#1976d2' }}>
                      {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                    </Typography>
             
                  </Box>
                </Paper>
              </Grid>

              {/* User Information */}
              <Grid item xs={12} md={8}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    bgcolor: '#fff',
                    height: '100%',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" color="#1976d2" gutterBottom>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon color="primary" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Email Address
                        </Typography>
                      </Box>
                      <Typography sx={{ ml: 4 }}>
                        {user ? user.email : 'Loading...'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="subtitle2" color="text.secondary">
                          User ID
                        </Typography>
                      </Box>
                      <Typography sx={{ ml: 4 }}>
                        {user ? user.unique_id : 'Loading...'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Preferences Panel */}
              {/* Preferences Panel */}
<Grid item xs={12} md={4}>
  <Paper 
    elevation={2} // Slight elevation for better visibility
    sx={{ 
      p: 4, 
      bgcolor: '#f9f9f9', // Light background for distinction
      height: '100%',
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Subtle shadow for elegance
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <DashboardIcon color="primary" />
      <Typography variant="h6" fontWeight="bold" color="#1976d2">
        Manage Preferences
      </Typography>
    </Box>
    <Divider sx={{ mb: 3 }} />
    
    {/* Search Box */}
    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
      <TextField
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Add new preference..."
        size="small"
        InputProps={{
          startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Subtle shadow
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
            },
          },
        }}
      />
      <Button
        variant="contained"
        onClick={handleSearch}
        sx={{
          bgcolor: '#1976d2',
          '&:hover': { bgcolor: '#1565c0' },
          borderRadius: 2,
          minWidth: '80px',
        }}
      >
        Add
      </Button>
    </Box>

    {/* Selected Items */}
    <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
      Your Selected Preferences:
    </Typography>
    <Box 
      sx={{ 
        mb: 3,
        maxHeight: 240,
        overflow: 'auto',
        borderRadius: 1,
        p: selectedItems.length > 0 ? 1 : 0,
        border: selectedItems.length > 0 ? '1px solid #e0e0e0' : 'none',
        bgcolor: selectedItems.length > 0 ? '#ffffff' : 'transparent',
      }}
    >
      {selectedItems.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No preferences selected yet
        </Typography>
      ) : (
        selectedItems.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1.5,
              mb: 1,
              bgcolor: item.isAutoFilled ? 'rgba(25, 118, 210, 0.08)' : 'white',
              borderRadius: 1,
              border: '1px solid',
              borderColor: item.isAutoFilled ? 'rgba(25, 118, 210, 0.3)' : '#e0e0e0',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                borderColor: item.isAutoFilled ? 'rgba(25, 118, 210, 0.5)' : '#bdbdbd',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                size="small" 
                label={item.name} 
                color={item.isAutoFilled ? "primary" : "default"}
                variant={item.isAutoFilled ? "filled" : "outlined"}
                sx={{ mr: 1 }}
              />
            </Box>
            <Tooltip title="Remove preference">
              <IconButton 
                size="small" 
                onClick={() => removeSelection(item.id)}
                color="error"
                sx={{ 
                  opacity: 0.7, 
                  '&:hover': { opacity: 1 } 
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))
      )}
    </Box>

    {/* Submit Button */}
    <Button
      variant="contained"
      fullWidth
      startIcon={<SaveIcon />}
      onClick={handleSubmitSelections}
      sx={{
        bgcolor: '#1976d2',
        '&:hover': { bgcolor: '#1565c0' },
        borderRadius: 2,
        py: 1.5,
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
        transition: 'all 0.2s ease',
        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      Save Preferences
    </Button>
  </Paper>
</Grid>
            </Grid>
          </Container>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4">Dashboard</Typography>
            <Typography>Dashboard content goes here</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Profile;