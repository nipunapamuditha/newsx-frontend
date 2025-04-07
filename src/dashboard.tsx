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

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  // Format time in MM:SS with safety checks
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Update progress function in useEffect
  useEffect(() => {
    const updateProgress = () => {
      const audioDuration = audioRef.current.duration;
      const audioCurrentTime = audioRef.current.currentTime;
      
      if (isFinite(audioCurrentTime)) {
        setCurrentTime(audioCurrentTime);
      }
      
      if (isFinite(audioDuration)) {
        setDuration(audioDuration);
      }
      
      if (isFinite(audioDuration) && isFinite(audioCurrentTime) && audioDuration > 0) {
        const calculatedProgress = (audioCurrentTime / audioDuration) * 100;
        if (isFinite(calculatedProgress)) {
          setProgress(calculatedProgress);
        }
      }
    };
    
    // Add event listeners for audio
    const audio = audioRef.current;
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('canplaythrough', () => setIsAudioReady(true));
    audio.addEventListener('ended', () => {
      // Auto-advance to next track if available
      if (audioFiles.length > 1) {
        handleNext();
      } else {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      }
    });

    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('canplaythrough', () => setIsAudioReady(true));
      audio.removeEventListener('ended', () => {});
    };
  }, [audioFiles.length]); // Only depend on audioFiles.length so this doesn't re-run unnecessarily
  
  // Handle audio source changes
  useEffect(() => {
    // Safety check
    if (audioFiles.length === 0 || !audioFiles[currentTrack] || !audioFiles[currentTrack].url) {
      setIsAudioReady(false);
      return;
    }
    
    // Prepare for new audio
    setIsAudioReady(false);
    
    // Reset states
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    
    const audio = audioRef.current;
    
    // Make sure we pause before changing the source
    audio.pause();
    
    // Set the new audio source
    audio.src = audioFiles[currentTrack].url;
    
    // Set volume
    audio.volume = volume / 100;
    
    // Load the audio
    audio.load();
    
    // Setup load event listener
    const canPlayHandler = () => {
      // Now we know the audio is ready
      setIsAudioReady(true);
      
      // Play if isPlaying flag is true
      if (isPlaying) {
        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Error playing audio:", error);
              setIsPlaying(false);
            });
          }
        } catch (error) {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        }
      }
    };
    
    // Add the event listener
    audio.addEventListener('canplaythrough', canPlayHandler, { once: true });
    
    // Return cleanup function
    return () => {
      audio.removeEventListener('canplaythrough', canPlayHandler);
    };
  }, [currentTrack, audioFiles, volume]);
  
  // Handle play state changes 
  useEffect(() => {
    if (!isAudioReady) return;
    
    if (isPlaying) {
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
        }
      } catch (error) {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isAudioReady]);

  // Safe progress change handler
  const handleProgressChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue !== 'number' || !isAudioReady) return;
    
    const audio = audioRef.current;
    const audioDuration = audio.duration;
    
    // Set progress state
    setProgress(newValue);
    
    // Only update currentTime if we have valid data
    if (isFinite(audioDuration) && audioDuration > 0 && audio.src) {
      const newTime = (newValue / 100) * audioDuration;
      
      // Double-check that we have a valid number
      if (isFinite(newTime) && newTime >= 0 && newTime <= audioDuration) {
        audio.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };

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
      
      // Also stop and clean up audio
      const audio = audioRef.current;
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Improved play/pause handler
  const handlePlayPause = () => {
    if (audioFiles.length === 0 || !audioFiles[currentTrack].url) {
      return; // Don't try to play if no valid URL
    }
    
    if (isPlaying) {
      setIsPlaying(false); // This will trigger the useEffect that handles pausing
    } else {
      setIsPlaying(true); // This will trigger the useEffect that handles playing
    }
  };

  // Previous track handler
  const handlePrevious = () => {
    if (audioFiles.length <= 1) return;
    
    // Pause current audio
    audioRef.current.pause();
    
    // Set new track index
    setCurrentTrack((prev) => (prev > 0 ? prev - 1 : audioFiles.length - 1));
    
    // Reset progress
    setProgress(0);
    setCurrentTime(0);
    
    // Keep playing state if already playing
    // The track change useEffect will handle actual playback
  };

  // Next track handler
  const handleNext = () => {
    if (audioFiles.length <= 1) return;
    
    // Pause current audio
    audioRef.current.pause();
    
    // Set new track index
    setCurrentTrack((prev) => (prev < audioFiles.length - 1 ? prev + 1 : 0));
    
    // Reset progress
    setProgress(0);
    setCurrentTime(0);
    
    // Keep playing state if already playing
    // The track change useEffect will handle actual playback
  };

  // Track selection handler
  const handleTrackSelect = (index: number) => {
    if (!audioFiles[index] || !audioFiles[index].url) return; // Don't select invalid tracks
    
    // If the same track is already selected, just toggle play/pause
    if (index === currentTrack) {
      handlePlayPause();
      return;
    }
    
    // Pause current audio
    audioRef.current.pause();
    
    // Set new track
    setCurrentTrack(index);
    
    // Reset progress
    setProgress(0);
    setCurrentTime(0);
    
    // Start playing the new track
    setIsPlaying(true);
  };
  
  // Volume change handler
  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      setVolume(newValue);
      
      // Only update audio volume if we have a valid audio element
      if (audioRef.current) {
        audioRef.current.volume = newValue / 100;
      }
    }
  };

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
                bgcolor: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? themeColors.primary : themeColors.textSecondary, 
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
                  {audioFiles.length > 0 && audioFiles[currentTrack] ? audioFiles[currentTrack].title : 'No Audio'}
                </Typography>
                <Typography variant="caption" color="textSecondary" noWrap>
                  {audioFiles.length > 0 && audioFiles[currentTrack] ? audioFiles[currentTrack].artist : 'No files available'}
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
                <IconButton onClick={handlePrevious} size="small" disabled={audioFiles.length <= 1 || !audioFiles[currentTrack]?.url}>
                  <SkipPreviousIcon sx={{ color: themeColors.textPrimary }} />
                </IconButton>
                <IconButton 
                  onClick={handlePlayPause} 
                  disabled={audioFiles.length === 0 || !audioFiles[currentTrack]?.url || !isAudioReady}
                  sx={{ 
                    mx: 1, 
                    bgcolor: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? themeColors.primary : themeColors.textSecondary,
                    color: themeColors.white,
                    '&:hover': {
                      bgcolor: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? themeColors.primary : themeColors.textSecondary,
                      opacity: 0.9,
                    }
                  }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={handleNext} size="small" disabled={audioFiles.length <= 1 || !audioFiles[currentTrack]?.url}>
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
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  width: 40, 
                  textAlign: 'center'
                }}>
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
                disabled={audioFiles.length === 0 || !audioFiles[currentTrack]?.url}
                sx={{ 
                  width: { xs: '50%', sm: 100 },
                  color: audioFiles.length > 0 && audioFiles[currentTrack]?.url ? themeColors.primary : themeColors.textSecondary,
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