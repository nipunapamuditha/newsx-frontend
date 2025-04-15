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

// Define theme colors
const themeColors = {
  primary: "#2196f3", // Blue
  primaryLight: "#bbdefb", // Lighter blue for hover states
  primaryDark: "#1565c0", // Darker blue for active states
  secondary: "#e3f2fd", // Light Blue
  white: "#ffffff",
  lightGray: "#f5f5f5",
  mediumGray: "#eeeeee",
  textPrimary: "#333333",
  textSecondary: "#757575",
  success: "#4caf50",
  error: "#f44336",
  warning: "#ff9800",
  divider: "#e0e0e0",
  background: "#f5f8ff",
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
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: themeColors.background,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: themeColors.primary,
          borderBottom: `1px solid ${themeColors.primaryDark}`,
        }}
      >
        <Toolbar sx={{ height: 64 }}>
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
                fontWeight: 500,
                letterSpacing: "0.5px",
              }}
            >
              User Profile
            </Typography>
          </Box>
          <Button
            startIcon={<PersonIcon />}
            onClick={() => handleNavigate("profile")}
            sx={{
              color: "white",
              borderBottom: currentPage === "profile" ? 2 : 0,
              borderColor: "white",
              mx: 1,
              borderRadius: "4px",
              py: 1,
              px: 2,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                transition: "background-color 0.3s",
              },
            }}
          >
            Profile
          </Button>
          <Button
            startIcon={<DashboardIcon />}
            onClick={() => handleNavigate("dashboard")}
            sx={{
              color: "white",
              borderBottom: currentPage === "dashboard" ? 2 : 0,
              borderColor: "white",
              borderRadius: "4px",
              py: 1,
              px: 2,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                transition: "background-color 0.3s",
              },
            }}
          >
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
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
                <CircularProgress size={40} />
                <Typography variant="body1" color="textSecondary">
                  Loading your profile...
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={4}>
                {/* Profile Header */}
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
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      badgeContent={
                        <Tooltip title="Account Settings">
                          <IconButton
                            sx={{
                              bgcolor: themeColors.primary,
                              color: themeColors.white,
                              "&:hover": {
                                bgcolor: themeColors.primaryDark,
                              },
                              width: 32,
                              height: 32,
                              border: `2px solid ${themeColors.white}`,
                            }}
                          >
                            <SettingsIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <Avatar
                        sx={{
                          width: { xs: 80, md: 100 },
                          height: { xs: 80, md: 100 },
                          bgcolor: themeColors.primary,
                          boxShadow: "0 4px 12px rgba(33,150,243,0.2)",
                        }}
                      >
                        <AccountCircleIcon sx={{ fontSize: { xs: 60, md: 80 } }} />
                      </Avatar>
                    </Badge>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: { xs: "center", sm: "flex-start" },
                      }}
                    >
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{
                          color: themeColors.textPrimary,
                          mb: 1,
                          textAlign: { xs: "center", sm: "left" },
                        }}
                      >
                        {user ? `${user.first_name} ${user.last_name}` : "Loading..."}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="textSecondary"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <EmailIcon fontSize="small" color="primary" />
                        {user ? user.email : "Loading..."}
                      </Typography>
                      <Chip
                        label="Active Account"
                        color="primary"
                        size="small"
                        icon={<CheckCircleIcon />}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                {/* User Information */}
                <Grid item xs={12} md={8}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      bgcolor: themeColors.white,
                      height: "100%",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
                      <Typography variant="h6" fontWeight="bold" color={themeColors.primary} gutterBottom>
                        Account Information
                      </Typography>
                      <Chip
                        label="Verified"
                        size="small"
                        color="success"
                        icon={<CheckCircleIcon />}
                        sx={{ height: 24 }}
                      />
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={4}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: themeColors.lightGray,
                            height: "100%",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <EmailIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="medium" color={themeColors.textPrimary}>
                              Email Address
                            </Typography>
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              p: 2,
                              bgcolor: themeColors.white,
                              borderRadius: 1,
                              border: `1px solid ${themeColors.divider}`,
                              wordBreak: "break-all",
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
                            borderRadius: 2,
                            bgcolor: themeColors.lightGray,
                            height: "100%",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <PersonIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="medium" color={themeColors.textPrimary}>
                              User ID
                            </Typography>
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              p: 2,
                              bgcolor: themeColors.white,
                              borderRadius: 1,
                              border: `1px solid ${themeColors.divider}`,
                              fontFamily: "monospace",
                              wordBreak: "break-all",
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
                            borderRadius: 2,
                            bgcolor: themeColors.secondary,
                            border: `1px dashed ${themeColors.primary}`,
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="medium" color={themeColors.primary} gutterBottom>
                            Account Status
                          </Typography>
                          <Typography variant="body2">
                            Your account is active and in good standing. You have full access to all features.
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Preferences Panel */}
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      bgcolor: themeColors.white,
                      height: "100%",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Background accent */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "150px",
                        height: "150px",
                        background: `radial-gradient(circle at top right, ${themeColors.primaryLight}, transparent 70%)`,
                        opacity: 0.7,
                        zIndex: 0,
                      }}
                    />

                    <Box sx={{ position: "relative", zIndex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <DashboardIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold" color={themeColors.primary}>
                          Manage Preferences
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 3 }} />

                      {/* Search Box */}
                      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                        <TextField
                          fullWidth
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Add new preference..."
                          size="small"
                          disabled={isSearching}
                          InputProps={{
                            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              "&.Mui-focused fieldset": {
                                borderColor: themeColors.primary,
                                borderWidth: 2,
                              },
                            },
                          }}
                        />
                        <Button
                          variant="contained"
                          onClick={handleSearch}
                          disabled={isSearching || !searchTerm.trim()}
                          sx={{
                            bgcolor: themeColors.primary,
                            "&:hover": { bgcolor: themeColors.primaryDark },
                            borderRadius: 2,
                            minWidth: "auto",
                            px: 2,
                          }}
                        >
                          {isSearching ? <CircularProgress size={24} color="inherit" /> : <AddIcon />}
                        </Button>
                      </Box>

                      {/* Selected Items */}
                      <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                        Your Selected Preferences:{" "}
                        <Chip
                          label={selectedItems.length}
                          size="small"
                          color="primary"
                          sx={{ ml: 1, height: 20, fontSize: "0.75rem" }}
                        />
                      </Typography>
                      <Box
                        sx={{
                          mb: 3,
                          maxHeight: 240,
                          overflow: "auto",
                          borderRadius: 2,
                          p: selectedItems.length > 0 ? 2 : 0,
                          border: selectedItems.length > 0 ? `1px solid ${themeColors.divider}` : "none",
                          bgcolor: selectedItems.length > 0 ? themeColors.white : "transparent",
                          "&::-webkit-scrollbar": {
                            width: "8px",
                          },
                          "&::-webkit-scrollbar-track": {
                            background: themeColors.lightGray,
                            borderRadius: "10px",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            background: themeColors.mediumGray,
                            borderRadius: "10px",
                            "&:hover": {
                              background: themeColors.textSecondary,
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
                              borderRadius: 2,
                            }}
                          >
                            <SearchIcon sx={{ color: themeColors.textSecondary, fontSize: 40, opacity: 0.5 }} />
                            <Typography variant="body2" color="textSecondary" align="center">
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
                                bgcolor: item.isAutoFilled ? themeColors.secondary : themeColors.white,
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: item.isAutoFilled ? themeColors.primary : themeColors.divider,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                  borderColor: item.isAutoFilled ? themeColors.primary : themeColors.primary,
                                },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Chip
                                  size="small"
                                  label={item.name}
                                  color={item.isAutoFilled ? "primary" : "default"}
                                  variant={item.isAutoFilled ? "filled" : "outlined"}
                                  sx={{ mr: 1 }}
                                />
                                {item.isAutoFilled && (
                                  <Tooltip title="Saved preference">
                                    <CheckCircleIcon fontSize="small" color="primary" sx={{ ml: 1, opacity: 0.7 }} />
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
                                    "&:hover": { opacity: 1, bgcolor: "rgba(244,67,54,0.1)" },
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
                        startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSubmitSelections}
                        disabled={isSaving || selectedItems.length === 0}
                        sx={{
                          bgcolor: themeColors.primary,
                          "&:hover": { bgcolor: themeColors.primaryDark },
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: "bold",
                          boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                          transition: "all 0.2s ease",
                          "&:active": {
                            transform: "scale(0.98)",
                          },
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

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Profile
