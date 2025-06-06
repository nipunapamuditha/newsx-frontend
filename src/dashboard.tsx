"use client"

import React, { useState, useRef, useEffect } from "react"
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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Slider,
  ListItemButton,
  Avatar,
  Divider,
  CircularProgress,
  Tooltip,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import PauseIcon from "@mui/icons-material/Pause"
import SkipNextIcon from "@mui/icons-material/SkipNext"
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious"
import VolumeUpIcon from "@mui/icons-material/VolumeUp"
import VolumeOffIcon from "@mui/icons-material/VolumeOff"
import MusicNoteIcon from "@mui/icons-material/MusicNote"
import AutorenewIcon from "@mui/icons-material/Autorenew"
import PersonIcon from "@mui/icons-material/Person"
import DashboardIcon from "@mui/icons-material/Dashboard"
import DeleteIcon from "@mui/icons-material/Delete"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import HeadphonesIcon from "@mui/icons-material/Headphones"
//import MoreVertIcon from "@mui/icons-material/MoreVert"
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
  playerGradient: "linear-gradient(135deg, #4361ee 0%, #3a56d4 100%)",
}

const Dashboard = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef(new Audio())

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState("Generate Now")
  const eventSourceRef = useRef<EventSource | null>(null)

  // Audio files state
  const [audioFiles, setAudioFiles] = useState<Array<{ title: string; artist: string; url: string }>>([
    { title: "Loading...", artist: "Please wait", url: "" },
  ])

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoadingAudio, setIsLoadingAudio] = useState(true)
  const [isAudioReady, setIsAudioReady] = useState(false)

  // File deletion tracking
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set())
  const [deletedFiles, setDeletedFiles] = useState<Set<string>>(new Set())

  // Format time in MM:SS with safety checks
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Update progress function in useEffect
  useEffect(() => {
    const updateProgress = () => {
      const audioDuration = audioRef.current.duration
      const audioCurrentTime = audioRef.current.currentTime

      if (isFinite(audioCurrentTime)) {
        setCurrentTime(audioCurrentTime)
      }

      if (isFinite(audioDuration)) {
        setDuration(audioDuration)
      }

      if (isFinite(audioDuration) && isFinite(audioCurrentTime) && audioDuration > 0) {
        const calculatedProgress = (audioCurrentTime / audioDuration) * 100
        if (isFinite(calculatedProgress)) {
          setProgress(calculatedProgress)
        }
      }
    }

    // Add event listeners for audio
    const audio = audioRef.current
    audio.addEventListener("timeupdate", updateProgress)
    audio.addEventListener("canplaythrough", () => setIsAudioReady(true))
    audio.addEventListener("ended", () => {
      // Auto-advance to next track if available
      if (audioFiles.length > 1) {
        handleNext()
      } else {
        setIsPlaying(false)
        setProgress(0)
        setCurrentTime(0)
      }
    })

    // Cleanup
    return () => {
      audio.removeEventListener("timeupdate", updateProgress)
      audio.removeEventListener("canplaythrough", () => setIsAudioReady(true))
      audio.removeEventListener("ended", () => {})
    }
  }, [audioFiles.length]) // Only depend on audioFiles.length so this doesn't re-run unnecessarily

  // Handle audio source changes
  useEffect(() => {
    // Safety check
    if (audioFiles.length === 0 || !audioFiles[currentTrack] || !audioFiles[currentTrack].url) {
      setIsAudioReady(false)
      return
    }

    // Prepare for new audio
    setIsAudioReady(false)

    // Reset states
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)

    const audio = audioRef.current

    // Make sure we pause before changing the source
    audio.pause()

    // Set the new audio source
    audio.src = audioFiles[currentTrack].url

    // Set volume
    audio.volume = isMuted ? 0 : volume / 100

    // Load the audio
    audio.load()

    // Setup load event listener
    const canPlayHandler = () => {
      // Now we know the audio is ready
      setIsAudioReady(true)

      // Play if isPlaying flag is true
      if (isPlaying) {
        try {
          const playPromise = audio.play()
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error("Error playing audio:", error)
              setIsPlaying(false)
            })
          }
        } catch (error) {
          console.error("Error playing audio:", error)
          setIsPlaying(false)
        }
      }
    }

    // Add the event listener
    audio.addEventListener("canplaythrough", canPlayHandler, { once: true })

    // Return cleanup function
    return () => {
      audio.removeEventListener("canplaythrough", canPlayHandler)
    }
  }, [currentTrack, audioFiles, volume, isMuted])

  // Handle play state changes
  useEffect(() => {
    if (!isAudioReady) return

    if (isPlaying) {
      try {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing audio:", error)
            setIsPlaying(false)
          })
        }
      } catch (error) {
        console.error("Error playing audio:", error)
        setIsPlaying(false)
      }
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, isAudioReady])

  // Safe progress change handler
  const handleProgressChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue !== "number" || !isAudioReady) return

    const audio = audioRef.current
    const audioDuration = audio.duration

    // Set progress state
    setProgress(newValue)

    // Only update currentTime if we have valid data
    if (isFinite(audioDuration) && audioDuration > 0 && audio.src) {
      const newTime = (newValue / 100) * audioDuration

      // Double-check that we have a valid number
      if (isFinite(newTime) && newTime >= 0 && newTime <= audioDuration) {
        audio.currentTime = newTime
        setCurrentTime(newTime)
      }
    }
  }

  // Fetch audio files when component mounts
  useEffect(() => {
    fetch("https://newsxapi.newsloop.xyz/v1/getaudio_files", {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          navigate("/") // Redirect to login if not authenticated
          throw new Error("Network response was not ok")
        }
        return response.json()
      })
      .then((data) => {
        if (data && data.audio_files && Array.isArray(data.audio_files)) {
          // Transform the URLs into our format
          const formattedFiles = data.audio_files.map((url: string, index: number) => {
            // Extract filename from URL
            const fileName = url.split("/").pop()?.split("?")[0] || `Audio ${index + 1}`
            const date = fileName.includes(".wav") ? fileName.split(".wav")[0] : fileName

            return {
              title: `${date}`, // Changed to display date directly
              artist: `Audio ${index + 1}`, // Changed to display track number
              url: url,
            }
          })

          setAudioFiles(
            formattedFiles.length > 0
              ? formattedFiles
              : [{ title: "No Audio Files", artist: "Generate to create new audio", url: "" }],
          )
        } else {
          setAudioFiles([{ title: "No Audio Files", artist: "Generate to create new audio", url: "" }])
        }
      })
      .catch((error) => {
        console.error("Error fetching audio files:", error)
        setAudioFiles([{ title: "Error Loading Files", artist: "Please try again later", url: "" }])
      })
      .finally(() => {
        setIsLoadingAudio(false)
      })
  }, [])

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
    navigate(`/${page}`)
  }

  // Handle Generate Now button click
  const handleGenerateNow = () => {
    if (isGenerating) {
      // Cancel the generation if it's already running
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsGenerating(false)
      setGenerationStatus("Generate Now")
      return
    }

    setIsGenerating(true)
    setGenerationStatus("Initializing...")

    // Create EventSource for SSE
    const eventSource = new EventSource("https://newsxapi.newsloop.xyz/v1/Generate_now", {
      withCredentials: true, // This is equivalent to credentials: 'include' in fetch
    })
    eventSourceRef.current = eventSource

    // Common handler for when the SSE connection ends (success, error, or done)
    const handleGenerationEnd = () => {
      setIsGenerating(false)
      setGenerationStatus("Generate Now") // Always reset to "Generate Now"
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      // Refresh audio files after 1 second
      setTimeout(() => {
        refreshAudioFiles()
      }, 1000)
    }

    eventSource.onmessage = (event) => {
      setGenerationStatus(event.data)

      // Check if this is a success message
      if (event.data.includes("Audio file generated successfully")) {
        // Even on success message, we'll let the 'done' event or a subsequent error/timeout handle the final cleanup,
        // or if this success message is the definitive end, call handleGenerationEnd.
        handleGenerationEnd();
      }
    }

    eventSource.onerror = () => {
      // Call the common handler on error. This will not set "Generation Failed".
      handleGenerationEnd()
    }

    // Listen for a "done" event if your API sends one
    eventSource.addEventListener("done", () => {
      // Call the common handler when "done" is received.
      handleGenerationEnd()
    })
  }

  // Delete audio file handler
  const handleDeleteAudio = (objectName: string, event: React.MouseEvent) => {
    // Prevent click event from bubbling up to parent (track selection)
    event.stopPropagation()

    // Add file to deleting state
    setDeletingFiles((prev) => new Set(prev).add(objectName))

    fetch("https://newsxapi.newsloop.xyz/v1/delete_audiofile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ object_name: objectName }),
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete audio file")
        }
        return response.json()
      })
      .then(() => {
        // Mark as successfully deleted
        setDeletedFiles((prev) => new Set(prev).add(objectName))

        // Remove from deleting state
        setDeletingFiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(objectName)
          return newSet
        })

        // Refresh audio files list
        refreshAudioFiles()

        // Remove success indicator after 3 seconds
        setTimeout(() => {
          setDeletedFiles((prev) => {
            const newSet = new Set(prev)
            newSet.delete(objectName)
            return newSet
          })
        }, 3000)
      })
      .catch((error) => {
        console.error("Error deleting audio file:", error)

        // Remove from deleting state on error
        setDeletingFiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(objectName)
          return newSet
        })
      })
  }

  // Extract the refresh logic to a separate function
  const refreshAudioFiles = () => {
    fetch("https://newsxapi.newsloop.xyz/v1/getaudio_files", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.audio_files && Array.isArray(data.audio_files)) {
          const formattedFiles = data.audio_files.map((url: string, index: number) => {
            const fileName = url.split("/").pop()?.split("?")[0] || `Audio ${index + 1}`
            const date = fileName.includes(".wav") ? fileName.split(".wav")[0] : fileName

            return {
              title: `${date}`, // Changed to display date directly
              artist: `Audio ${index + 1}`, // Changed to display track number
              url: url,
            }
          })

          setAudioFiles(
            formattedFiles.length > 0
              ? formattedFiles
              : [{ title: "No Audio Files", artist: "Generate to create new audio", url: "" }],
          )

          // Auto-select the newest audio file
          if (formattedFiles.length > 0) {
            setCurrentTrack(0)
            // Optionally auto-play the new file
            setIsPlaying(true)
          }
        }
      })
      .catch((error) => {
        console.error("Error refreshing audio files:", error)
      })
  }

  // Clean up event source on component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Also stop and clean up audio
      const audio = audioRef.current
      audio.pause()
      audio.src = ""
    }
  }, [])

  // Improved play/pause handler
  const handlePlayPause = () => {
    if (audioFiles.length === 0 || !audioFiles[currentTrack].url) {
      return // Don't try to play if no valid URL
    }

    if (isPlaying) {
      setIsPlaying(false) // This will trigger the useEffect that handles pausing
    } else {
      setIsPlaying(true) // This will trigger the useEffect that handles playing
    }
  }

  // Previous track handler
  const handlePrevious = () => {
    if (audioFiles.length <= 1) return

    // Pause current audio
    audioRef.current.pause()

    // Set new track index
    setCurrentTrack((prev) => (prev > 0 ? prev - 1 : audioFiles.length - 1))

    // Reset progress
    setProgress(0)
    setCurrentTime(0)

    // Keep playing state if already playing
    // The track change useEffect will handle actual playback
  }

  // Next track handler
  const handleNext = () => {
    if (audioFiles.length <= 1) return

    // Pause current audio
    audioRef.current.pause()

    // Set new track index
    setCurrentTrack((prev) => (prev < audioFiles.length - 1 ? prev + 1 : 0))

    // Reset progress
    setProgress(0)
    setCurrentTime(0)

    // Keep playing state if already playing
    // The track change useEffect will handle actual playback
  }

  // Track selection handler
  const handleTrackSelect = (index: number) => {
    if (!audioFiles[index] || !audioFiles[index].url) return // Don't select invalid tracks

    // If the same track is already selected, just toggle play/pause
    if (index === currentTrack) {
      handlePlayPause()
      return
    }

    // Pause current audio
    audioRef.current.pause()

    // Set new track
    setCurrentTrack(index)

    // Reset progress
    setProgress(0)
    setCurrentTime(0)

    // Start playing the new track
    setIsPlaying(true)
  }

  // Volume change handler
  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      setVolume(newValue)

      // If we were muted, unmute
      if (isMuted) {
        setIsMuted(false)
      }

      // Only update audio volume if we have a valid audio element
      if (audioRef.current) {
        audioRef.current.volume = newValue / 100
      }
    }
  }

  // Toggle mute
  const handleToggleMute = () => {
    if (isMuted) {
      // Unmute - restore previous volume
      setIsMuted(false)
      if (audioRef.current) {
        audioRef.current.volume = volume / 100
      }
    } else {
      // Mute - set to 0
      setIsMuted(true)
      if (audioRef.current) {
        audioRef.current.volume = 0
      }
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        bgcolor: themeColors.background,
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      }}
    >
      {/* App Bar - Modernized with gradient and better spacing */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: themeColors.playerGradient,
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
              Audio Dashboard
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

      {/* Main Content - Improved spacing and layout */}
      <Container
        maxWidth={false}
        sx={{
          pt: 4,
          pb: { xs: 15, sm: 10 },
          px: { xs: 2, sm: 3, md: 4 },
          flex: 1,
          overflow: "auto",
          width: "100%",
        }}
      >
        {/* Generate Now Button - Standalone card for better visibility */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 4,
            bgcolor: themeColors.white,
            borderRadius: "16px",
            boxShadow: themeColors.cardShadow,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative background element */}
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
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: themeColors.textPrimary,
                mb: 1,
              }}
            >
              Generate New Audio
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Create a new audio file based on your preferences
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleGenerateNow}
            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutorenewIcon />}
            sx={{
              background: isGenerating ? alpha(themeColors.primary, 0.1) : themeColors.playerGradient,
              color: isGenerating ? themeColors.primary : themeColors.white,
              "&:hover": {
                background: isGenerating ? alpha(themeColors.primary, 0.1) : themeColors.primaryDark,
              },
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: "10px",
              boxShadow: isGenerating ? "none" : `0 4px 14px ${alpha(themeColors.primary, 0.3)}`,
              minWidth: { xs: "100%", sm: "200px" },
              zIndex: 1,
              transition: "all 0.2s",
              "&:active": {
                transform: "scale(0.98)",
              },
            }}
          >
            {generationStatus}
          </Button>
        </Paper>

        {/* Playlist Section - Enhanced with modern styling */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            bgcolor: themeColors.white,
            borderRadius: "16px",
            height: "100%",
            minHeight: "60vh",
            boxShadow: themeColors.cardShadow,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              pb: 2,
              borderBottom: `1px solid ${themeColors.divider}`,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: themeColors.textPrimary,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <HeadphonesIcon sx={{ color: themeColors.primary }} />
              Your Audio Library
            </Typography>

            <Typography variant="body2" color="textSecondary">
              {audioFiles.length > 0 && audioFiles[0].url
                ? `${audioFiles.length} audio file${audioFiles.length !== 1 ? "s" : ""}`
                : "No files"}
            </Typography>
          </Box>

          {/* Track List Header */}
          {!isLoadingAudio && audioFiles.length > 0 && audioFiles[0].url && (
            <Box
              sx={{
                px: 3,
                py: 1.5,
                bgcolor: themeColors.lightGray,
                borderRadius: "10px",
                mb: 2,
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
              }}
            >
              <Typography sx={{ width: "50px", fontWeight: 600, color: themeColors.textSecondary }}>#</Typography>
              <Typography sx={{ flex: 1, fontWeight: 600, color: themeColors.textSecondary }}>Title</Typography>
              <Box sx={{ display: "flex", alignItems: "center", width: "100px" }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: themeColors.textSecondary }} />
                <Typography sx={{ fontWeight: 600, color: themeColors.textSecondary }}>Duration</Typography>
              </Box>
              <Typography sx={{ width: "50px" }}></Typography>
            </Box>
          )}

          {isLoadingAudio ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                my: 8,
                flexDirection: "column",
                gap: 2,
              }}
            >
              <CircularProgress size={40} sx={{ color: themeColors.primary }} />
              <Typography variant="body1" color="textSecondary">
                Loading your audio files...
              </Typography>
            </Box>
          ) : (
            <List
              sx={{
                width: "100%",
                maxHeight: "60vh",
                overflow: "auto",
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
              {audioFiles.length === 0 || !audioFiles[0].url ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 8,
                    gap: 2,
                  }}
                >
                  <HeadphonesIcon sx={{ fontSize: 60, color: themeColors.textSecondary, opacity: 0.5 }} />
                  <Typography variant="h6" color="textSecondary">
                    No Audio Files Available
                  </Typography>
                  <Typography variant="body2" color="textSecondary" align="center">
                    Click the "Generate New Audio" button to create your first audio file.
                  </Typography>
                </Box>
              ) : (
                audioFiles.map((track, index) => {
                  // Extract object name from the URL
                  const urlParts = track.url.split("/")
                  const objectName =
                    urlParts.length >= 2
                      ? `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1].split("?")[0]}`
                      : ""

                  return (
                    <React.Fragment key={index}>
                      <ListItem
                        disablePadding
                        sx={{
                          mb: 1,
                          bgcolor: currentTrack === index ? alpha(themeColors.primary, 0.05) : "transparent",
                          borderRadius: "12px",
                          opacity: track.url ? 1 : 0.6,
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: currentTrack === index ? alpha(themeColors.primary, 0.08) : themeColors.lightGray,
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                          },
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleTrackSelect(index)}
                          disabled={!track.url}
                          sx={{
                            borderRadius: "12px",
                            py: 2,
                            px: 3,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              width: "100%",
                              alignItems: "center",
                            }}
                          >
                            {/* Track Number/Play Icon */}
                            <Box
                              sx={{
                                width: "50px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {currentTrack === index && isPlaying ? (
                                <Avatar
                                  sx={{
                                    background: themeColors.playerGradient,
                                    width: 36,
                                    height: 36,
                                    boxShadow: `0 4px 10px ${alpha(themeColors.primary, 0.3)}`,
                                  }}
                                >
                                  <PauseIcon fontSize="small" />
                                </Avatar>
                              ) : (
                                <Avatar
                                  sx={{
                                    bgcolor: track.url
                                      ? currentTrack === index
                                        ? alpha(themeColors.primary, 0.1)
                                        : themeColors.lightGray
                                      : alpha(themeColors.textSecondary, 0.1),
                                    color: track.url
                                      ? currentTrack === index
                                        ? themeColors.primary
                                        : themeColors.textPrimary
                                      : themeColors.textSecondary,
                                    width: 36,
                                    height: 36,
                                    fontWeight: 600,
                                    border: currentTrack === index ? `1px solid ${alpha(themeColors.primary, 0.3)}` : "none",
                                  }}
                                >
                                  {index + 1}
                                </Avatar>
                              )}
                            </Box>

                            {/* Track Info */}
                            <ListItemText
                              primary={track.title}
                              secondary={track.artist}
                              primaryTypographyProps={{
                                fontWeight: currentTrack === index ? 600 : 500,
                                color: themeColors.textPrimary,
                                sx: {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: { xs: "150px", sm: "300px", md: "unset" },
                                },
                              }}
                              secondaryTypographyProps={{
                                color: themeColors.textSecondary,
                                sx: {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                },
                              }}
                              sx={{ flex: 1 }}
                            />

                            {/* Duration */}
                            <Box
                              sx={{
                                width: "100px",
                                display: { xs: "none", sm: "flex" },
                                justifyContent: "flex-start",
                                alignItems: "center",
                              }}
                            >
                              {currentTrack === index && isPlaying ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: themeColors.primary,
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <span className="pulse-dot" 
                                    style={{ 
                                      display: "inline-block",
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      backgroundColor: themeColors.primary,
                                      animation: "pulse 1.5s infinite"
                                    }}
                                  />
                                  Playing
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="textSecondary" fontWeight={500}>
                                  {formatTime(currentTrack === index ? duration : 0)}
                                </Typography>
                              )}
                            </Box>

                            {/* Delete Button with Status Icons */}
                            {track.url && (
                              <Box sx={{ width: "50px", display: "flex", justifyContent: "center" }}>
                                {deletedFiles.has(objectName) ? (
                                  <CheckCircleIcon fontSize="small" sx={{ color: themeColors.success }} />
                                ) : (
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleDeleteAudio(objectName, e)}
                                      disabled={deletingFiles.has(objectName)}
                                      sx={{
                                        color: deletingFiles.has(objectName) ? "text.disabled" : themeColors.error,
                                        "&:hover": {
                                          bgcolor: alpha(themeColors.error, 0.1),
                                          transform: "scale(1.1)",
                                        },
                                        transition: "all 0.2s",
                                      }}
                                    >
                                      {deletingFiles.has(objectName) ? (
                                        <CircularProgress size={16} color="inherit" />
                                      ) : (
                                        <DeleteIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            )}
                          </Box>
                        </ListItemButton>
                      </ListItem>
                      {index < audioFiles.length - 1 && (
                        <Divider
                          component="li"
                          sx={{
                            my: 0.5,
                            opacity: 0.6,
                            borderColor: alpha(themeColors.divider, 0.5),
                          }}
                        />
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </List>
          )}

          {/* Empty state for no audio files */}
          {!isLoadingAudio && audioFiles.length === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                gap: 2,
              }}
            >
              <HeadphonesIcon sx={{ fontSize: 60, color: themeColors.textSecondary, opacity: 0.5 }} />
              <Typography variant="h6" color="textSecondary">
                No Audio Files Available
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Click the "Generate New Audio" button to create your first audio file.
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>

      {/* Fixed Media Player at Bottom - Enhanced with modern styling */}
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: { xs: 2, sm: 3 },
          bgcolor: themeColors.white,
          borderTop: `1px solid ${themeColors.divider}`,
          zIndex: 1100,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          {/* Track Info */}
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  background: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? themeColors.playerGradient : alpha(themeColors.textSecondary, 0.1),
                  mr: 1.5,
                  width: { xs: 44, sm: 48 },
                  height: { xs: 44, sm: 48 },
                  boxShadow: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? `0 4px 10px ${alpha(themeColors.primary, 0.3)}` : "none",
                }}
              >
                <MusicNoteIcon fontSize="small" />
              </Avatar>
              <Box sx={{ overflow: "hidden" }}>
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{
                    maxWidth: { xs: "200px", sm: "160px" },
                    fontWeight: 600,
                    color: themeColors.textPrimary,
                  }}
                >
                  {audioFiles.length > 0 && audioFiles[currentTrack] ? audioFiles[currentTrack].title : "No Audio"}
                </Typography>
                <Typography variant="caption" color="textSecondary" noWrap sx={{ display: "block" }}>
                  {audioFiles.length > 0 && audioFiles[currentTrack]
                    ? audioFiles[currentTrack].artist
                    : "No files available"}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Player Controls */}
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: { xs: 1, sm: 0 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Tooltip title="Previous">
                  <span>
                    <IconButton
                      onClick={handlePrevious}
                      size="small"
                      disabled={audioFiles.length <= 1 || !audioFiles[currentTrack]?.url}
                      sx={{
                        color: themeColors.textPrimary,
                        "&:hover": { 
                          bgcolor: themeColors.lightGray,
                          transform: "scale(1.1)",
                        },
                        "&.Mui-disabled": { color: alpha(themeColors.textSecondary, 0.3) },
                        transition: "all 0.2s",
                      }}
                    >
                      <SkipPreviousIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={isPlaying ? "Pause" : "Play"}>
                  <span>
                    <IconButton
                      onClick={handlePlayPause}
                      disabled={audioFiles.length === 0 || !audioFiles[currentTrack]?.url || !isAudioReady}
                      sx={{
                        mx: 1,
                        background: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? themeColors.playerGradient : alpha(themeColors.textSecondary, 0.1),
                        color: themeColors.white,
                        "&:hover": {
                          background: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? themeColors.primaryDark : alpha(themeColors.textSecondary, 0.1),
                          transform: "scale(1.05)",
                        },
                        transition: "all 0.2s",
                        width: 48,
                        height: 48,
                        boxShadow: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? `0 4px 10px ${alpha(themeColors.primary, 0.3)}` : "none",
                        "&:active": {
                          transform: "scale(0.95)",
                        },
                      }}
                    >
                      {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Next">
                  <span>
                    <IconButton
                      onClick={handleNext}
                      size="small"
                      disabled={audioFiles.length <= 1 || !audioFiles[currentTrack]?.url}
                      sx={{
                        color: themeColors.textPrimary,
                        "&:hover": { 
                          bgcolor: themeColors.lightGray,
                          transform: "scale(1.1)",
                        },
                        "&.Mui-disabled": { color: alpha(themeColors.textSecondary, 0.3) },
                        transition: "all 0.2s",
                      }}
                    >
                      <SkipNextIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    width: 40,
                    textAlign: "center",
                    color: themeColors.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  {formatTime(currentTime)}
                </Typography>
                <Slider
                  size="small"
                  value={progress}
                  onChange={handleProgressChange}
                  disabled={audioFiles.length === 0 || !audioFiles[currentTrack]?.url || !isAudioReady}
                  sx={{
                    mx: { xs: 0, sm: 1 },
                    color: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? themeColors.primary : themeColors.textSecondary,
                    height: 4,
                    "& .MuiSlider-thumb": {
                      width: 12,
                      height: 12,
                      transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
                      "&:hover, &.Mui-focusVisible": {
                        boxShadow: `0px 0px 0px 8px ${alpha(themeColors.primary, 0.2)}`,
                      },
                    },
                    "& .MuiSlider-rail": {
                      opacity: 0.5,
                    },
                    "& .MuiSlider-track": {
                      background: themeColors.playerGradient,
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    width: 40,
                    textAlign: "center",
                    color: themeColors.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  {formatTime(duration)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Volume Control */}
          <Grid item xs={12} sm={3}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "center", sm: "flex-end" },
                mt: { xs: 1, sm: 0 },
                mb: { xs: 1, sm: 0 },
              }}
            >
              <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                <IconButton
                  onClick={handleToggleMute}
                  disabled={audioFiles.length === 0 || !audioFiles[currentTrack]?.url}
                  size="small"
                  sx={{ 
                    color: isMuted ? themeColors.error : themeColors.textSecondary,
                    "&:hover": {
                      bgcolor: alpha(isMuted ? themeColors.error : themeColors.primary, 0.1),
                    },
                  }}
                >
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
              </Tooltip>
              <Slider
                size="small"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                disabled={audioFiles.length === 0 || !audioFiles[currentTrack]?.url}
                sx={{
                  width: { xs: "50%", sm: 100 },
                  color: audioFiles.length > 0 && audioFiles[currentTrack]?.url 
                    ? isMuted ? alpha(themeColors.error, 0.7) : themeColors.primary 
                    : themeColors.textSecondary,
                  height: 4,
                  "& .MuiSlider-thumb": {
                    width: 12,
                    height: 12,
                    "&:hover, &.Mui-focusVisible": {
                      boxShadow: `0px 0px 0px 8px ${alpha(isMuted ? themeColors.error : themeColors.primary, 0.2)}`,
                    },
                  },
                  "& .MuiSlider-track": {
                    background: isMuted ? alpha(themeColors.error, 0.7) : themeColors.playerGradient,
                  },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Add global styles for animations */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.7;
          }
        }
      `}</style>
    </Box>
  )
}

export default Dashboard