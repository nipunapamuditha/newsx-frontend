"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
  useTheme,
  useMediaQuery,
  CircularProgress,
  Badge,
  Alert,
  Snackbar,
  alpha,
} from "@mui/material"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import SearchIcon from "@mui/icons-material/Search"
import EmailIcon from "@mui/icons-material/Email"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import SaveIcon from "@mui/icons-material/Save"
import DashboardIcon from "@mui/icons-material/Dashboard"
import PersonIcon from "@mui/icons-material/Person"
import SettingsIcon from "@mui/icons-material/Settings"
import AddIcon from "@mui/icons-material/Add"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import newsxLogo from "/newxlogo.png"

// Define theme colors - Updated with a more modern palette
const themeColors = {
  primary: "#4361ee", // Modern blue
  primaryLight: "#d8e1ff", // Lighter blue for hover states
  primaryDark: "#3a56d4", // Darker blue for active states
  secondary: "#edf2ff", // Light Blue background
  white: "#ffffff",
  lightGray: "#f8fafc", // Lighter background
  mediumGray: "#eef2f6",
  textPrimary: "#1e293b", // Darker text for better contrast
  textSecondary: "#64748b", // Modern secondary text
  success: "#10b981", // Modern green
  error: "#ef4444", // Modern red
  warning: "#f59e0b", // Modern orange
  divider: "#e2e8f0",
  background: "#f1f5f9", // Subtle background
  cardShadow: "0 4px 20px rgba(0, 0, 0, 0.05)", // Soft shadow for cards
}

interface User {
  first_name: string
  last_name: string
  email: string
  unique_id: string
}

interface SelectedItem {
  id: string
  name: string
  isAutoFilled?: boolean
}

const Profile = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [currentPage, setCurrentPage] = useState("profile")
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("https://newsxapi.newsloop.xyz/v1/getuser", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }

        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setNotification({
          open: true,
          message: "Failed to load user data. Please try again.",
          severity: "error",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  useEffect(() => {
    const fetchExistingPreferences = async () => {
      try {
        const response = await fetch("https://newsxapi.newsloop.xyz/v1/Get_Preferances", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          const autoFilledItems = data.usernames.map((username: string) => ({
            id: `auto-${username}`,
            name: username,
            isAutoFilled: true,
          }))
          setSelectedItems(autoFilledItems)
        }
      } catch (error) {
        console.error("Error fetching preferences:", error)
        setNotification({
          open: true,
          message: "Failed to load preferences. Please try again.",
          severity: "error",
        })
      }
    }

    fetchExistingPreferences()
  }, [])

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
    navigate(`/${page}`)
  }

  const handleSearch = async () => {
    if (!searchTerm) return

    setIsSearching(true)

    try {
      const response = await fetch("https://newsxapi.newsloop.xyz/v1/getTwUsernames", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ tw_user_name: searchTerm }),
      })

      if (response.status === 200) {
        const data = await response.json()

        // Check if item already exists
        const exists = selectedItems.some((item) => item.name.toLowerCase() === searchTerm.toLowerCase())

        if (exists) {
          setNotification({
            open: true,
            message: "This preference already exists in your list",
            severity: "warning",
          })
        } else {
          setSelectedItems([
            ...selectedItems,
            {
              id: data.id,
              name: searchTerm,
              isAutoFilled: false,
            },
          ])
          setNotification({
            open: true,
            message: "Preference added successfully",
            severity: "success",
          })
        }
        setSearchTerm("")
      } else {
        setNotification({
          open: true,
          message: "Failed to add preference. Please try again.",
          severity: "error",
        })
      }
    } catch (error) {
      console.error("Error searching:", error)
      setNotification({
        open: true,
        message: "An error occurred. Please try again.",
        severity: "error",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmitSelections = async () => {
    setIsSaving(true)

    try {
      const usernames = selectedItems.map((item) => item.name)

      const response = await fetch("https://newsxapi.newsloop.xyz/v1/publish-preferances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ usernames }),
      })

      if (response.ok) {
        // Fetch updated preferences after successful submission
        const preferencesResponse = await fetch("https://newsxapi.newsloop.xyz/v1/Get_Preferances", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (preferencesResponse.ok) {
          const data = await preferencesResponse.json()
          const autoFilledItems = data.usernames.map((username: string) => ({
            id: `auto-${username}`,
            name: username,
            isAutoFilled: true,
          }))
          setSelectedItems(autoFilledItems)
          setNotification({
            open: true,
            message: "Preferences saved successfully",
            severity: "success",
          })
        }
      } else {
        setNotification({
          open: true,
          message: "Failed to save preferences. Please try again.",
          severity: "error",
        })
      }
    } catch (error) {
      console.error("Error submitting selections:", error)
      setNotification({
        open: true,
        message: "An error occurred while saving. Please try again.",
        severity: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const removeSelection = (id: string) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== id))
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch()
    }
  }

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: themeColors.background,
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      }}
    >
      {/* Header - Modernized with gradient and better spacing */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryDark} 100%)`,
          borderBottom: "none",
        }}
      >
        <Toolbar sx={{ height: 70, px: { xs: 2, sm: 4 } }}>
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={newsxLogo || "/placeholder.svg"}
              alt="NEWSX Logo"
              style={{
                height: "43px",
                width: "auto",
                marginRight: "16px",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                display: { xs: "none", sm: "block" },
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              User Profile
            </Typography>
          </Box>
          
          {/* Navigation buttons with improved styling */}
          <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 } }}>
            <Button
              startIcon={<PersonIcon />}
              onClick={() => handleNavigate("profile")}
              sx={{
                color: "white",
                position: "relative",
                borderRadius: "8px",
                py: 1,
                px: { xs: 1.5, sm: 2 },
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.15)",
                  transition: "background-color 0.3s",
                },
                "&::after": currentPage === "profile" ? {
                  content: '""',
                  position: "absolute",
                  bottom: "6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "20px",
                  height: "3px",
                  bgcolor: "white",
                  borderRadius: "10px",
                } : {},
              }}
            >
              <Typography sx={{ display: { xs: "none", sm: "block" }, ml: 0.5 }}>Profile</Typography>
              {isMobile && <PersonIcon />}
            </Button>
            <Button
              startIcon={<DashboardIcon />}
              onClick={() => handleNavigate("dashboard")}
              sx={{
                color: "white",
                position: "relative",
                borderRadius: "8px",
                py: 1,
                px: { xs: 1.5, sm: 2 },
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.15)",
                  transition: "background-color 0.3s",
                },
                "&::after": currentPage === "dashboard" ? {
                  content: '""',
                  position: "absolute",
                  bottom: "6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "20px",
                  height: "3px",
                  bgcolor: "white",
                  borderRadius: "10px",
                } : {},
              }}
            >
              <Typography sx={{ display: { xs: "none", sm: "block" }, ml: 0.5 }}>Dashboard</Typography>
              {isMobile && <DashboardIcon />}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area - Improved spacing and layout */}
      <Box sx={{ flexGrow: 1, overflow: "auto", p: { xs: 2, sm: 3, md: 4 } }}>
        {currentPage === "profile" ? (
          <Container maxWidth="xl" sx={{ height: "100%" }}>
            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "50vh",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <CircularProgress size={40} sx={{ color: themeColors.primary }} />
                <Typography variant="body1" color="textSecondary">
                  Loading your profile...
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={4}>
                {/* Profile Header - Enhanced with modern styling */}
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      mb: 2,
                      bgcolor: themeColors.white,
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "center", sm: "flex-start" },
                      gap: 3,
                      borderRadius: "16px",
                      boxShadow: themeColors.cardShadow,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Decorative background element */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: -100,
                        right: -100,
                        width: 300,
                        height: 300,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${alpha(themeColors.primary, 0.1)} 0%, ${alpha(themeColors.primaryLight, 0.05)} 100%)`,
                        zIndex: 0,
                      }}
                    />
                    
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      badgeContent={
                        <Tooltip title="Account Settings">
                          <IconButton
                            sx={{
                              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryDark} 100%)`,
                              color: themeColors.white,
                              "&:hover": {
                                bgcolor: themeColors.primaryDark,
                              },
                              width: 32,
                              height: 32,
                              border: `2px solid ${themeColors.white}`,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                          >
                            <SettingsIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <Avatar
                        sx={{
                          width: { xs: 90, md: 110 },
                          height: { xs: 90, md: 110 },
                          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryDark} 100%)`,
                          boxShadow: "0 4px 20px rgba(67, 97, 238, 0.3)",
                          border: `3px solid ${themeColors.white}`,
                          zIndex: 1,
                        }}
                      >
                        <AccountCircleIcon sx={{ fontSize: { xs: 60, md: 70 }, color: "white" }} />
                      </Avatar>
                    </Badge>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: { xs: "center", sm: "flex-start" },
                        zIndex: 1,
                      }}
                    >
                      <Typography
                        variant="h4"
                        fontWeight="700"
                        sx={{
                          color: themeColors.textPrimary,
                          mb: 1,
                          textAlign: { xs: "center", sm: "left" },
                          fontSize: { xs: "1.5rem", md: "2rem" },
                        }}
                      >
                        {user ? `${user.first_name} ${user.last_name}` : "Loading..."}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                          color: themeColors.textSecondary,
                        }}
                      >
                        <EmailIcon fontSize="small" sx={{ color: themeColors.primary }} />
                        {user ? user.email : "Loading..."}
                      </Typography>
                      <Chip
                        label="Active Account"
                        color="primary"
                        size="small"
                        icon={<CheckCircleIcon />}
                        sx={{ 
                          mt: 1, 
                          bgcolor: alpha(themeColors.primary, 0.1), 
                          color: themeColors.primary,
                          fontWeight: 500,
                          '& .MuiChip-icon': { color: themeColors.success },
                          borderRadius: "8px",
                          height: "28px",
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                {/* User Information - Enhanced with modern styling */}
                <Grid item xs={12} md={8}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      bgcolor: themeColors.white,
                      height: "100%",
                      borderRadius: "16px",
                      boxShadow: themeColors.cardShadow,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        fontWeight="600" 
                        color={themeColors.primary} 
                        gutterBottom
                        sx={{ 
                          position: "relative",
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            bottom: "-8px",
                            left: 0,
                            width: "40px",
                            height: "3px",
                            bgcolor: themeColors.primary,
                            borderRadius: "10px",
                          }
                        }}
                      >
                        Account Information
                      </Typography>
                      <Chip
                        label="Verified"
                        size="small"
                        color="success"
                        icon={<CheckCircleIcon />}
                        sx={{ 
                          height: 28, 
                          bgcolor: alpha(themeColors.success, 0.1), 
                          color: themeColors.success,
                          fontWeight: 500,
                          '& .MuiChip-icon': { color: themeColors.success },
                          borderRadius: "8px",
                        }}
                      />
                    </Box>
                    <Divider sx={{ mb: 3, borderColor: alpha(themeColors.divider, 0.6) }} />

                    <Grid container spacing={4}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 3,
                            borderRadius: "12px",
                            bgcolor: themeColors.lightGray,
                            height: "100%",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <Box 
                              sx={{ 
                                bgcolor: alpha(themeColors.primary, 0.1), 
                                borderRadius: "8px", 
                                p: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <EmailIcon sx={{ color: themeColors.primary }} />
                            </Box>
                            <Typography variant="subtitle1" fontWeight="600" color={themeColors.textPrimary}>
                              Email Address
                            </Typography>
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              p: 2,
                              bgcolor: themeColors.white,
                              borderRadius: "10px",
                              border: `1px solid ${themeColors.divider}`,
                              wordBreak: "break-all",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            }}
                          >
                            {user ? user.email : "Loading..."}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 3,
                            borderRadius: "12px",
                            bgcolor: themeColors.lightGray,
                            height: "100%",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <Box 
                              sx={{ 
                                bgcolor: alpha(themeColors.primary, 0.1), 
                                borderRadius: "8px", 
                                p: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <PersonIcon sx={{ color: themeColors.primary }} />
                            </Box>
                            <Typography variant="subtitle1" fontWeight="600" color={themeColors.textPrimary}>
                              User ID
                            </Typography>
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              p: 2,
                              bgcolor: themeColors.white,
                              borderRadius: "10px",
                              border: `1px solid ${themeColors.divider}`,
                              fontFamily: "monospace",
                              wordBreak: "break-all",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            }}
                          >
                            {user ? user.unique_id : "Loading..."}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Box
                          sx={{
                            mt: 2,
                            p: 3,
                            borderRadius: "12px",
                            background: `linear-gradient(135deg, ${alpha(themeColors.primary, 0.05)} 0%, ${alpha(themeColors.primaryLight, 0.2)} 100%)`,
                            border: `1px solid ${alpha(themeColors.primary, 0.2)}`,
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {/* Decorative element */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: -20,
                              right: -20,
                              width: 100,
                              height: 100,
                              borderRadius: "50%",
                              background: alpha(themeColors.primary, 0.1),
                              zIndex: 0,
                            }}
                          />
                          
                          <Box sx={{ position: "relative", zIndex: 1 }}>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight="600" 
                              color={themeColors.primary} 
                              gutterBottom
                              sx={{ display: "flex", alignItems: "center", gap: 1 }}
                            >
                              <CheckCircleIcon fontSize="small" />
                              Account Status
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                              Your account is active and in good standing. You have full access to all features.
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Preferences Panel - Enhanced with modern styling */}
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      bgcolor: themeColors.white,
                      height: "100%",
                      borderRadius: "16px",
                      boxShadow: themeColors.cardShadow,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Background accent */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at top right, ${alpha(themeColors.primary, 0.1)}, transparent 70%)`,
                        zIndex: 0,
                      }}
                    />

                    <Box sx={{ position: "relative", zIndex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <Box 
                          sx={{ 
                            bgcolor: alpha(themeColors.primary, 0.1), 
                            borderRadius: "8px", 
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <DashboardIcon sx={{ color: themeColors.primary }} />
                        </Box>
                        <Typography 
                          variant="h6" 
                          fontWeight="600" 
                          color={themeColors.primary}
                          sx={{ 
                            position: "relative",
                            "&::after": {
                              content: '""',
                              position: "absolute",
                              bottom: "-8px",
                              left: 0,
                              width: "40px",
                              height: "3px",
                              bgcolor: themeColors.primary,
                              borderRadius: "10px",
                            }
                          }}
                        >
                          Manage Preferences
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 3, borderColor: alpha(themeColors.divider, 0.6) }} />

                      {/* Search Box - Enhanced with modern styling */}
                      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                        <TextField
                          fullWidth
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Add Substack username..."
                          size="small"
                          disabled={isSearching}
                          InputProps={{
                            startAdornment: <SearchIcon color="action" sx={{ mr: 1, color: themeColors.textSecondary }} />,
                            sx: {
                              borderRadius: "10px",
                              bgcolor: themeColors.lightGray,
                              '&.Mui-focused': {
                                boxShadow: `0 0 0 2px ${alpha(themeColors.primary, 0.2)}`,
                              },
                              '& fieldset': {
                                borderColor: 'transparent',
                              },
                              '&:hover fieldset': {
                                borderColor: themeColors.divider,
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: themeColors.primary,
                                borderWidth: '1px',
                              },
                              transition: 'all 0.2s',
                            }
                          }}
                        />
                        <Button
                          variant="contained"
                          onClick={handleSearch}
                          disabled={isSearching || !searchTerm.trim()}
                          sx={{
                            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryDark} 100%)`,
                            "&:hover": { 
                              background: `linear-gradient(135deg, ${themeColors.primaryDark} 0%, ${themeColors.primaryDark} 100%)`,
                              boxShadow: `0 4px 14px ${alpha(themeColors.primary, 0.4)}`,
                            },
                            borderRadius: "10px",
                            minWidth: "auto",
                            px: 2,
                            boxShadow: `0 4px 10px ${alpha(themeColors.primary, 0.3)}`,
                            transition: "all 0.2s",
                          }}
                        >
                          {isSearching ? <CircularProgress size={24} color="inherit" /> : <AddIcon />}
                        </Button>
                      </Box>

                      {/* Selected Items - Enhanced with modern styling */}
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ color: themeColors.textPrimary }}>
                        Your Selected Preferences:{" "}
                        <Chip
                          label={selectedItems.length}
                          size="small"
                          color="primary"
                          sx={{ 
                            ml: 1, 
                            height: 20, 
                            fontSize: "0.75rem",
                            bgcolor: alpha(themeColors.primary, 0.1),
                            color: themeColors.primary,
                            fontWeight: 600,
                          }}
                        />
                      </Typography>
                      <Box
                        sx={{
                          mb: 3,
                          maxHeight: 240,
                          overflow: "auto",
                          borderRadius: "12px",
                          p: selectedItems.length > 0 ? 2 : 0,
                          border: selectedItems.length > 0 ? `1px solid ${alpha(themeColors.divider, 0.6)}` : "none",
                          bgcolor: selectedItems.length > 0 ? themeColors.white : "transparent",
                          "&::-webkit-scrollbar": {
                            width: "6px",
                          },
                          "&::-webkit-scrollbar-track": {
                            background: themeColors.lightGray,
                            borderRadius: "10px",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            background: alpha(themeColors.primary, 0.2),
                            borderRadius: "10px",
                            "&:hover": {
                              background: alpha(themeColors.primary, 0.4),
                            },
                          },
                        }}
                      >
                        {selectedItems.length === 0 ? (
                          <Box
                            sx={{
                              py: 4,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                              bgcolor: themeColors.lightGray,
                              borderRadius: "12px",
                            }}
                          >
                            <SearchIcon sx={{ color: themeColors.textSecondary, fontSize: 40, opacity: 0.5 }} />
                            <Typography variant="body2" color="textSecondary" align="center" sx={{ fontWeight: 500 }}>
                              No preferences selected yet
                            </Typography>
                            <Typography variant="caption" color="textSecondary" align="center">
                              Add preferences using the search box above
                            </Typography>
                          </Box>
                        ) : (
                          selectedItems.map((item) => (
                            <Box
                              key={item.id}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                p: 1.5,
                                mb: 1,
                                bgcolor: item.isAutoFilled ? alpha(themeColors.primary, 0.05) : themeColors.white,
                                borderRadius: "10px",
                                border: "1px solid",
                                borderColor: item.isAutoFilled ? alpha(themeColors.primary, 0.3) : themeColors.divider,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                  borderColor: item.isAutoFilled ? themeColors.primary : alpha(themeColors.primary, 0.3),
                                  transform: "translateY(-2px)",
                                },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Chip
                                  size="small"
                                  label={item.name}
                                  color={item.isAutoFilled ? "primary" : "default"}
                                  variant={item.isAutoFilled ? "filled" : "outlined"}
                                  sx={{ 
                                    mr: 1,
                                    borderRadius: "8px",
                                    bgcolor: item.isAutoFilled ? alpha(themeColors.primary, 0.1) : "transparent",
                                    color: item.isAutoFilled ? themeColors.primary : themeColors.textSecondary,
                                    border: item.isAutoFilled ? "none" : `1px solid ${themeColors.divider}`,
                                    fontWeight: 500,
                                  }}
                                />
                                {item.isAutoFilled && (
                                  <Tooltip title="Saved preference">
                                    <CheckCircleIcon fontSize="small" sx={{ ml: 1, color: themeColors.success }} />
                                  </Tooltip>
                                )}
                              </Box>
                              <Tooltip title="Remove preference">
                                <IconButton
                                  size="small"
                                  onClick={() => removeSelection(item.id)}
                                  sx={{
                                    color: themeColors.error,
                                    opacity: 0.7,
                                    "&:hover": { 
                                      opacity: 1, 
                                      bgcolor: alpha(themeColors.error, 0.1),
                                      transform: "scale(1.1)",
                                    },
                                    transition: "all 0.2s",
                                  }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ))
                        )}
                      </Box>

                      {/* Submit Button - Enhanced with modern styling */}
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSubmitSelections}
                        disabled={isSaving || selectedItems.length === 0}
                        sx={{
                          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryDark} 100%)`,
                          "&:hover": { 
                            background: `linear-gradient(135deg, ${themeColors.primaryDark} 0%, ${themeColors.primaryDark} 100%)`,
                            boxShadow: `0 4px 14px ${alpha(themeColors.primary, 0.4)}`,
                          },
                          borderRadius: "10px",
                          py: 1.5,
                          fontWeight: "600",
                          boxShadow: `0 4px 12px ${alpha(themeColors.primary, 0.3)}`,
                          transition: "all 0.2s ease",
                          "&:active": {
                            transform: "scale(0.98)",
                          },
                          "&:disabled": {
                            background: themeColors.mediumGray,
                            color: themeColors.textSecondary,
                          }
                        }}
                      >
                        {isSaving ? "Saving..." : "Save Preferences"}
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Container>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4">Dashboard</Typography>
            <Typography>Dashboard content goes here</Typography>
          </Box>
        )}
      </Box>

      {/* Notification Snackbar - Enhanced with modern styling */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ 
            width: "100%",
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            fontWeight: 500,
            '& .MuiAlert-icon': {
              fontSize: '1.25rem'
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Profile