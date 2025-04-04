import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, Button, Container, Paper,
  Grid, List, ListItem, ListItemText, IconButton, Slider,
  ListItemButton, Avatar, Divider, CircularProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';

// Define theme colors
const themeColors = {
  primary: '#2196f3', // Blue
  secondary: '#e3f2fd', // Light Blue
  white: '#ffffff',
  lightGray: '#f5f5f5',
  textPrimary: '#333333',
  textSecondary: '#757575',
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef(new Audio());
  
  // New state for generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('Generate Now');
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Changed from constant to state for dynamic loading
  const [audioFiles, setAudioFiles] = useState<Array<{title: string, artist: string, url: string}>>([
    { title: 'Loading...', artist: 'Please wait', url: '' }
  ]);


  // Add these state variables
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

// Add this helper function
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Update your updateProgress function in useEffect
useEffect(() => {
  const updateProgress = () => {
    const duration = audioRef.current.duration;
    const currentTime = audioRef.current.currentTime;
    if (!isNaN(duration) && duration > 0) {
      setProgress((currentTime / duration) * 100);
      setCurrentTime(currentTime);
      setDuration(duration);
    }
  };

  // Additional listener for when duration becomes available
  const updateDuration = () => {
    setDuration(audioRef.current.duration);
  };

  audioRef.current.addEventListener('timeupdate', updateProgress);
  audioRef.current.addEventListener('loadedmetadata', updateDuration);
  
  return () => {
    audioRef.current.removeEventListener('timeupdate', updateProgress);
    audioRef.current.removeEventListener('loadedmetadata', updateDuration);
  };
}, []);
  
  // Loading state
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);

  // Fetch audio files when component mounts
  useEffect(() => {
    fetch('https://newsxapi.newsloop.xyz/v1/getaudio_files', {
      credentials: 'include',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data && data.audio_files && Array.isArray(data.audio_files)) {
          // Transform the URLs into our format
          const formattedFiles = data.audio_files.map((url: string, index: number) => {
            // Extract filename from URL
            const fileName = url.split('/').pop()?.split('?')[0] || `Audio ${index + 1}`;
            const date = fileName.includes('.wav') 
              ? fileName.split('.wav')[0] 
              : fileName;
              
            return {
              title: `${date}`, // Changed to display date directly
              artist: `Audio ${index + 1}`, // Changed to display track number
              url: url
            };
          });
          
          setAudioFiles(formattedFiles.length > 0 ? formattedFiles : [
            { title: 'No Audio Files', artist: 'Generate to create new audio', url: '' }
          ]);
        } else {
          setAudioFiles([
            { title: 'No Audio Files', artist: 'Generate to create new audio', url: '' }
          ]);
        }
      })
      .catch(error => {
        console.error('Error fetching audio files:', error);
        setAudioFiles([
          { title: 'Error Loading Files', artist: 'Please try again later', url: '' }
        ]);
      })
      .finally(() => {
        setIsLoadingAudio(false);
      });
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    navigate(`/${page}`);
  };

  // Handle Generate Now button click
  const [receivedSuccessMessage, setReceivedSuccessMessage] = useState(false);

// In handleGenerateNow function
const handleGenerateNow = () => {
  if (isGenerating) {
    // Cancel the generation if it's already running
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsGenerating(false);
    setGenerationStatus('Generate Now');
    return;
  }
  
  setIsGenerating(true);
  setGenerationStatus('Initializing...');
  setReceivedSuccessMessage(false); // Reset success flag
  
  // Create EventSource for SSE
  const eventSource = new EventSource('https://newsxapi.newsloop.xyz/v1/Generate_now', {
    withCredentials: true // This is equivalent to credentials: 'include' in fetch
  });
  eventSourceRef.current = eventSource;
  
  eventSource.onmessage = (event) => {
    setGenerationStatus(event.data);
    
    // Check if this is a success message
    if (event.data.includes("Audio file generated successfully")) {
      setReceivedSuccessMessage(true);
      
      // Treat this as completion
      setTimeout(() => {
        setGenerationStatus('Generate Now');
        setIsGenerating(false);
        eventSource.close();
        eventSourceRef.current = null;
        
        // Refresh audio files
        refreshAudioFiles();
      }, 1000); // Give a small delay to ensure all messages are processed
    }
  };
  
  eventSource.onerror = () => {
    // Only treat as an error if we didn't receive a success message
    if (!receivedSuccessMessage) {
      setGenerationStatus('Generation Failed');
      setIsGenerating(false);
    } else {
      setGenerationStatus('Generate Now');
      setIsGenerating(false);
    }
    eventSource.close();
    eventSourceRef.current = null;
  };
  
  // Listen for a "done" event if your API sends one
  eventSource.addEventListener('done', () => {
    setGenerationStatus('Generate Now');
    setIsGenerating(false);
    eventSource.close();
    eventSourceRef.current = null;
    
    // Refresh audio files after generation completes
    refreshAudioFiles();
  });
};

// Extract the refresh logic to a separate function
const refreshAudioFiles = () => {
  fetch('https://newsxapi.newsloop.xyz/v1/getaudio_files', {
    credentials: 'include',
  })
    .then(response => response.json())
    .then(data => {
      if (data && data.audio_files && Array.isArray(data.audio_files)) {
        const formattedFiles = data.audio_files.map((url: string, index: number) => {
          const fileName = url.split('/').pop()?.split('?')[0] || `Audio ${index + 1}`;
          const date = fileName.includes('.wav') 
            ? fileName.split('.wav')[0] 
            : fileName;
            
          return {
            title: `${date}`, // Changed to display date directly
            artist: `Audio ${index + 1}`, // Changed to display track number
            url: url
          };
        });
        
        setAudioFiles(formattedFiles.length > 0 ? formattedFiles : [
          { title: 'No Audio Files', artist: 'Generate to create new audio', url: '' }
        ]);
        
        // Auto-select the newest audio file
        if (formattedFiles.length > 0) {
          setCurrentTrack(0);
          // Optionally auto-play the new file
          setIsPlaying(true);
        }
      }
    })
    .catch(error => {
      console.error('Error refreshing audio files:', error);
    });
};
  
  // Clean up event source on component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (audioFiles.length === 0 || !audioFiles[currentTrack].url) {
      return; // Don't try to play if no valid URL
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (audioFiles.length <= 1) return;
    setCurrentTrack((prev) => (prev > 0 ? prev - 1 : audioFiles.length - 1));
  };

  const handleNext = () => {
    if (audioFiles.length <= 1) return;
    setCurrentTrack((prev) => (prev < audioFiles.length - 1 ? prev + 1 : 0));
  };

  const handleTrackSelect = (index: number) => {
    if (!audioFiles[index].url) return; // Don't select invalid tracks
    setCurrentTrack(index);
    setIsPlaying(true);
  };

  const handleProgressChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      setProgress(newValue);
      audioRef.current.currentTime = (newValue / 100) * audioRef.current.duration;
    }
  };
  
  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      setVolume(newValue);
      audioRef.current.volume = newValue / 100;
    }
  };

  // Format time in MM:SS

  useEffect(() => {
    if (audioFiles.length > 0 && audioFiles[currentTrack].url) {
      audioRef.current.src = audioFiles[currentTrack].url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack, audioFiles]);

  useEffect(() => {
    const updateProgress = () => {
      const duration = audioRef.current.duration;
      const currentTime = audioRef.current.currentTime;
      if (!isNaN(duration) && duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    };

    audioRef.current.addEventListener('timeupdate', updateProgress);
    return () => audioRef.current.removeEventListener('timeupdate', updateProgress);
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      bgcolor: themeColors.lightGray
    }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ bgcolor: '#1976d2', boxShadow: 2 }}>
  <Toolbar>
    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
      <span style={{ color: 'white' }}>NEWS</span>
      <span style={{ color: '#000000' }}>X</span>
    </Typography>
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

      {/* Main Content */}
      <Container 
        maxWidth={false} 
        sx={{ 
          pt: 4, 
          pb: { xs: 15, sm: 10 }, // Larger bottom padding for mobile
          px: { xs: 2, sm: 3, md: 4 },
          flex: 1,
          overflow: 'auto',
          width: '100%'
        }}
      >
        {/* Playlist - Single content section to fill entire screen */}
        <Paper elevation={0} sx={{ 
          p: { xs: 2, sm: 3 }, 
          bgcolor: themeColors.white,
          borderRadius: 2,
          border: `1px solid ${themeColors.secondary}`,
          height: '100%',
          minHeight: '70vh'
        }}>
          <Typography variant="h5" gutterBottom sx={{ 
            color: themeColors.textPrimary, 
            fontWeight: 600,
            mb: 3
          }}>
            Your Playlist
          </Typography>
          
          {isLoadingAudio ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ width: '100%' }}>
              {audioFiles.map((track, index) => (
                <React.Fragment key={index}>
                  <ListItem 
                    disablePadding
                    sx={{ 
                      mb: 1,
                      bgcolor: currentTrack === index ? themeColors.secondary : 'transparent',
                      borderRadius: 1,
                      opacity: track.url ? 1 : 0.6
                    }}
                  >
                    <ListItemButton 
                      onClick={() => handleTrackSelect(index)}
                      disabled={!track.url}
                      sx={{ 
                        borderRadius: 1,
                        py: { xs: 1.5, sm: 1 },
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        width: '100%',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' }
                      }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: track.url ? themeColors.primary : themeColors.textSecondary, 
                            width: { xs: 36, sm: 40 }, 
                            height: { xs: 36, sm: 40 }, 
                            mr: { xs: 0, sm: 2 },
                            mb: { xs: 1, sm: 0 },
                            fontSize: '0.9rem' 
                          }}
                        >
                          {index + 1}
                        </Avatar>
                        <ListItemText
                          primary={track.title}
                          secondary={track.artist}
                          primaryTypographyProps={{
                            fontWeight: currentTrack === index ? 600 : 400,
                            color: themeColors.textPrimary
                          }}
                          secondaryTypographyProps={{
                            color: themeColors.textSecondary
                          }}
                        />
                        {currentTrack === index && isPlaying && track.url && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: themeColors.primary,
                              ml: { xs: 0, sm: 2 },
                              mt: { xs: 1, sm: 0 }
                            }}
                          >
                            Now Playing
                          </Typography>
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  {index < audioFiles.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
          
          {/* Generate Now Button */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mt: 4,
            mb: 2
          }}>
            <Button
              variant="contained"
              onClick={handleGenerateNow}
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutorenewIcon />}
              sx={{
                bgcolor: isGenerating ? themeColors.secondary : themeColors.primary,
                color: isGenerating ? themeColors.primary : themeColors.white,
                '&:hover': {
                  bgcolor: isGenerating ? themeColors.secondary : themeColors.primary,
                  opacity: 0.9,
                },
                textTransform: 'none',
                minWidth: '200px',
                maxWidth: '400px',
                fontSize: '1rem',
                py: 1,
                px: 3,
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              {generationStatus}
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Fixed Media Player at Bottom */}
      <Paper 
        elevation={4} 
        sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: { xs: 1.5, sm: 2 },
          bgcolor: themeColors.white,
          borderTop: `1px solid ${themeColors.secondary}`,
          zIndex: 1100
        }}
      >
        <Grid container alignItems="center" spacing={1}>
          {/* Track Info */}
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ 
                bgcolor: audioFiles.length > 0 && audioFiles[currentTrack].url ? themeColors.primary : themeColors.textSecondary, 
                mr: 1.5,
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 }
              }}>
                <MusicNoteIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  noWrap 
                  sx={{ 
                    maxWidth: { xs: '200px', sm: '160px' }, 
                    fontWeight: 500 
                  }}
                >
                  {audioFiles.length > 0 ? audioFiles[currentTrack].title : 'No Audio'}
                </Typography>
                <Typography variant="caption" color="textSecondary" noWrap>
                  {audioFiles.length > 0 ? audioFiles[currentTrack].artist : 'No files available'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          {/* Player Controls */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mt: { xs: 1, sm: 0 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton onClick={handlePrevious} size="small" disabled={audioFiles.length <= 1 || !audioFiles[currentTrack].url}>
                  <SkipPreviousIcon sx={{ color: themeColors.textPrimary }} />
                </IconButton>
                <IconButton 
                  onClick={handlePlayPause} 
                  disabled={audioFiles.length === 0 || !audioFiles[currentTrack].url}
                  sx={{ 
                    mx: 1, 
                    bgcolor: audioFiles.length > 0 && audioFiles[currentTrack].url ? themeColors.primary : themeColors.textSecondary,
                    color: themeColors.white,
                    '&:hover': {
                      bgcolor: audioFiles.length > 0 && audioFiles[currentTrack].url ? themeColors.primary : themeColors.textSecondary,
                      opacity: 0.9,
                    }
                  }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={handleNext} size="small" disabled={audioFiles.length <= 1 || !audioFiles[currentTrack].url}>
                  <SkipNextIcon sx={{ color: themeColors.textPrimary }} />
                </IconButton>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                width: '100%', 
                alignItems: 'center' 
              }}>
                <Typography variant="caption" sx={{ 
                  width: 40, 
                  textAlign: 'center',
                  display: { xs: 'none', sm: 'block' }
                }}>
                  0:00
                </Typography>
                <Slider
                  size="small"
                  value={progress}
                  onChange={handleProgressChange}
                  disabled={audioFiles.length === 0 || !audioFiles[currentTrack].url}
                  sx={{ 
                    mx: { xs: 0, sm: 1 },
                    color: audioFiles.length > 0 && audioFiles[currentTrack].url ? themeColors.primary : themeColors.textSecondary,
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                    }
                  }}
                />
             <Typography variant="caption">
  {formatTime(currentTime)}
</Typography>
<Slider /* ... */ />
<Typography variant="caption">
  {formatTime(duration)}
</Typography>
              </Box>
            </Box>
          </Grid>
          
          {/* Volume Control */}
          <Grid item xs={12} sm={3}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: { xs: 'center', sm: 'flex-end' },
              mt: { xs: 1, sm: 0 },
              mb: { xs: 1, sm: 0 }
            }}>
              <VolumeUpIcon sx={{ color: themeColors.textSecondary, mr: 1 }} />
              <Slider
                size="small"
                value={volume}
                onChange={handleVolumeChange}
                disabled={audioFiles.length === 0 || !audioFiles[currentTrack].url}
                sx={{ 
                  width: { xs: '50%', sm: 100 },
                  color: audioFiles.length > 0 && audioFiles[currentTrack].url ? themeColors.primary : themeColors.textSecondary,
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;