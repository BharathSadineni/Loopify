"use client"
import React from "react"
import { useState, useEffect, useRef } from "react"
import { Play, Pause, SkipBack, SkipForward, VolumeX, Volume1, Volume2, Minus, Plus, Repeat } from "lucide-react"
import styled from "@emotion/styled"
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "./LoopButtonAnim.css";

const API_URL = "http://127.0.0.1:5000"
const SPOTIFY_GREEN = "#1ED760"
const SPOTIFY_GRAY = "#666666"

const WidgetContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  pointer-events: auto;
  user-select: none;
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
`

const StatusDot = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 16px;
  border-radius: 50%;
  background: ${({ isPlaying }) =>
        isPlaying
            ? "linear-gradient(135deg, #1ED760 60%, #2AF598 100%)"
            : "linear-gradient(135deg, #666666 60%, #888888 100%)"};
  transition: all 0.3s ease;
  box-shadow: ${({ isPlaying }) =>
        isPlaying ? "0 0 8px 2px rgba(30, 215, 96, 0.4)" : "0 0 4px 1px rgba(102, 102, 102, 0.3)"};
`

const MinimizedCard = styled.div`
  background: rgba(0,0,0,0.92);
  backdrop-filter: blur(12px);
  border: 2.5px solid rgba(30,215,96,0.35);
  border-radius: 16px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 
    0 8px 32px rgba(0,0,0,0.3), 
    0 0 0 1px rgba(30,215,96,0.15), 
    inset 0 1px 0 rgba(255,255,255,0.1);
  cursor: pointer;
  width: auto;
  min-width: 220px;
  max-width: 360px;
  height: 40px;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s ease;
  opacity: ${({ isVisible, autoHidden }) => (isVisible && !autoHidden ? 1 : 0)};
  transform: ${({ isVisible }) => (isVisible ? "scale(1)" : "scale(0.9)")};
  
  &:hover {
    border-color: rgba(30,215,96,0.5);
    box-shadow: 
      0 12px 40px rgba(0,0,0,0.35), 
      0 0 0 1px rgba(30,215,96,0.25), 
      inset 0 1px 0 rgba(255,255,255,0.15);
    transform: scale(1.02);
  }
`

// Make HoverCard draggable except for controls
const HoverCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0,0,0,0.95);
  backdrop-filter: blur(16px);
  border: 2px solid rgba(30,215,96,0.4);
  border-radius: 16px;
  padding: 18px 28px;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;
  width: auto;
  min-width: 360px;
  max-width: 600px;
  height: auto;
  transform-origin: center center;
  /* Only animate scale/opacity, not position */
  transition: opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s ease;
  box-shadow: 
    0 16px 64px rgba(0,0,0,0.4),
    0 0 0 1px rgba(30,215,96,0.15),
    inset 0 1px 0 rgba(255,255,255,0.08);
  opacity: ${({ isVisible, autoHidden }) => (isVisible && !autoHidden ? 1 : 0)};
  transform: ${({ isVisible }) => (isVisible ? "scale(1)" : "scale(0.9)")};
  position: absolute;
`
const SongInfo = styled.div`
  display: flex;
  align-items: center;
  margin-right: 12px;
  gap: 0;
  min-width: 0;
  flex-shrink: 0;
`

const SongTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`

const SongTitle = styled.span`
  color: #fff;
  font-size: ${({ $hover }) => ($hover ? "17px" : "14px")};
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${({ $hover }) => ($hover ? "280px" : "180px")};
  line-height: 1.2;
  margin-bottom: 2px;
`

const ArtistName = styled.span`
  color: #b3b3b3;
  font-size: ${({ $hover }) => ($hover ? "15px" : "10px")};
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${({ $hover }) => ($hover ? "280px" : "180px")};
  line-height: 1.2;
`

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: relative;
  z-index: 1;
  margin-top: 6px;
  cursor: default; /* Prevent drag cursor in controls area */
`

const ControlButton = styled.button`
  background: transparent;
  border: none;
  outline: none;
  color: #b3b3b3;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  font-size: 16px;

  &:hover {
    color: #fff;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`

// Collapsible Loop Control Buttons - they collapse to 0 width when hidden
const CollapsibleLoopButton = styled(ControlButton)`
  width: ${({ isVisible }) => (isVisible ? "26px" : "0px")};
  min-width: 0;
  max-width: ${({ isVisible }) => (isVisible ? "26px" : "0px")};
  margin-left: ${({ isVisible }) => (isVisible ? "10px" : "0px")};
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) => (isVisible ? "scaleX(1)" : "scaleX(0)")};
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};
  transform-origin: center;
  & > * {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  &:hover {
    color: #fff;
    transform: ${({ isVisible }) => (isVisible ? "scale(1.1)" : "scaleX(0)")};
  }

  &:active {
    transform: ${({ isVisible }) => (isVisible ? "scale(0.95)" : "scaleX(0)")};
  }
`

const PlayButton = styled(ControlButton)`
  color: ${({ isPlaying }) => (isPlaying ? SPOTIFY_GREEN : "#b3b3b3")};

  &:hover {
    color: ${SPOTIFY_GREEN};
  }
`

const LoopButton = styled(ControlButton)`
  color: ${({ active }) => (active ? SPOTIFY_GREEN : "#b3b3b3")};

  &:hover {
    color: ${({ active }) => (active ? SPOTIFY_GREEN : "#fff")};
  }
`

const LoopCounter = styled.span`
  position: absolute;
  top: -10px;
  right: -10px;
  background: ${SPOTIFY_GREEN};
  color: #000;
  font-size: 11px;
  font-weight: 700;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(30,215,96,0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transform: scale(1);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`

const VolumeButton = styled(ControlButton)`
  color: ${({ muted }) => (muted ? SPOTIFY_GREEN : "#b3b3b3")};

  &:hover {
    color: ${({ muted }) => (muted ? SPOTIFY_GREEN : "#fff")};
  }
`

// AnimatedLoopButton for smooth in/out animation (opacity/scale only, no width)
const AnimatedLoopButton = styled(ControlButton)`
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) => (isVisible ? "scale(1)" : "scale(0.7)")};
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};
  transition: opacity 0.3s, transform 0.3s;
  will-change: opacity, transform;
  margin: 0;
`

const LoopifyApp = () => {
    const [widgetState, setWidgetState] = useState("minimized")
    const [hidden, setHidden] = useState(false)
    const [autoHidden, setAutoHidden] = useState(false) // New state for auto-hide
    const [currentSong, setCurrentSong] = useState({
        title: "No song Detected",
        artist: "",
    })
    const [isPlaying, setIsPlaying] = useState(true)
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(75)
    const [loopState, setLoopState] = useState("song")
    const [songLoopCount, setSongLoopCount] = useState(3)
    const [loopsDone, setLoopsDone] = useState(0)
    const [backendConnected, setBackendConnected] = useState(false)
    const [error, setError] = useState(null)

    const lastApiCall = useRef({})
    const lastButtonClick = useRef({})
    const userActionTime = useRef({ isMuted: 0, loopState: 0, volume: 0, isPlaying: 0 })
    const hoverTimeoutRef = useRef(null)
    const autoHideTimeoutRef = useRef(null) // New timeout for auto-hide

    // Widget position state (shared by both MinimizedCard and HoverCard)
    const [widgetPos, setWidgetPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const widgetRef = useRef(null); // Used for both cards
    const dragAnimationFrame = useRef(null);

    // Auto-hide functionality
    const resetAutoHideTimer = () => {
        if (autoHideTimeoutRef.current) {
            clearTimeout(autoHideTimeoutRef.current);
        }
        setAutoHidden(false);
        // Only start timer if in minimized mode
        if (widgetState === "minimized") {
            autoHideTimeoutRef.current = setTimeout(() => {
                setAutoHidden(true);
            }, 8000); // 8 seconds
        }
    };

    // Clear auto-hide timer when widget becomes hidden
    useEffect(() => {
        if (hidden) {
            if (autoHideTimeoutRef.current) {
                clearTimeout(autoHideTimeoutRef.current);
            }
            setAutoHidden(false);
        } else {
            resetAutoHideTimer();
        }
    }, [hidden]);

    // Clear auto-hide timer when widget state changes
    useEffect(() => {
        if (autoHideTimeoutRef.current) {
            clearTimeout(autoHideTimeoutRef.current);
        }
        if (widgetState === "hover") {
            setAutoHidden(false); // Show widget when in hover mode
        } else if (widgetState === "minimized") {
            // Start timer only when in minimized mode
            autoHideTimeoutRef.current = setTimeout(() => {
                setAutoHidden(true);
            }, 8000);
        }
    }, [widgetState]);

    // Cleanup auto-hide timeout on unmount
    useEffect(() => {
        return () => {
            if (autoHideTimeoutRef.current) {
                clearTimeout(autoHideTimeoutRef.current);
            }
        };
    }, []);

    // Reset auto-hide timer on any interaction
    const handleInteraction = () => {
        if (!hidden) {
            resetAutoHideTimer();
        }
    };

    // Clamp position to window bounds
    function clampPosition(x, y) {
        const parent = widgetRef.current?.parentElement;
        if (!parent) return { x, y };
        const parentRect = parent.getBoundingClientRect();
        const cardRect = widgetRef.current.getBoundingClientRect();
        const minX = 0;
        const minY = 0;
        const maxX = parent.clientWidth - cardRect.width;
        const maxY = parent.clientHeight - cardRect.height;
        return {
            x: Math.max(minX, Math.min(x, maxX)),
            y: Math.max(minY, Math.min(y, maxY)),
        };
    }

    // Mouse event handlers for dragging
    const onWidgetMouseDown = (e) => {
        // Bring window to front on any click
        if (window.electronAPI && typeof window.electronAPI.send === 'function') {
            window.electronAPI.send('bring-to-front');
        }
        handleInteraction(); // Reset auto-hide timer
        if (e.target.closest('button')) return; // Don't drag if clicking on buttons
        if (widgetRef.current) {
            const style = widgetRef.current.style;
            if (!style.left || !style.top) {
                const parent = widgetRef.current.parentElement;
                const cardRect = widgetRef.current.getBoundingClientRect();
                const parentRect = parent.getBoundingClientRect();
                const left = (parent.clientWidth - cardRect.width) / 2;
                const top = (parent.clientHeight - cardRect.height) / 2;
                style.left = left + 'px';
                style.top = top + 'px';
                setWidgetPos({ x: left, y: top });
            }
            const parentRect = widgetRef.current.parentElement.getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - (parentRect.left + parseFloat(style.left)),
                y: e.clientY - (parentRect.top + parseFloat(style.top)),
            };
        }
        setDragging(true);
        e.preventDefault();
    };

    // requestAnimationFrame drag loop
    const dragMove = (clientX, clientY) => {
        if (!widgetRef.current) return;
        const parentRect = widgetRef.current.parentElement.getBoundingClientRect();
        let x = clientX - parentRect.left - dragOffset.current.x;
        let y = clientY - parentRect.top - dragOffset.current.y;
        const clamped = clampPosition(x, y);
        widgetRef.current.style.left = clamped.x + 'px';
        widgetRef.current.style.top = clamped.y + 'px';
        setWidgetPos(clamped);
    };

    useEffect(() => {
        if (!dragging) return;
        let lastEvent = null;
        const onMouseMove = (e) => {
            lastEvent = e;
            if (!dragAnimationFrame.current) {
                dragAnimationFrame.current = requestAnimationFrame(() => {
                    dragMove(lastEvent.clientX, lastEvent.clientY);
                    dragAnimationFrame.current = null;
                });
            }
        };
        const onMouseUp = (e) => {
            setDragging(false);
            dragAnimationFrame.current && cancelAnimationFrame(dragAnimationFrame.current);
            dragAnimationFrame.current = null;
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            dragAnimationFrame.current && cancelAnimationFrame(dragAnimationFrame.current);
            dragAnimationFrame.current = null;
        };
    }, [dragging]);

    // On mount or when widgetState changes, set initial position if not set
    useEffect(() => {
        if (widgetRef.current && (widgetState === 'hover' || widgetState === 'minimized')) {
            const style = widgetRef.current.style;
            if (!style.left || !style.top) {
                const parent = widgetRef.current.parentElement;
                const cardRect = widgetRef.current.getBoundingClientRect();
                const left = (parent.clientWidth - cardRect.width) / 2;
                const top = (parent.clientHeight - cardRect.height) / 2;
                style.left = left + 'px';
                style.top = top + 'px';
                setWidgetPos({ x: left, y: top });
            }
        }
    }, [widgetState]);

    // Apply widgetPos to both cards
    useEffect(() => {
        if (widgetRef.current) {
            widgetRef.current.style.left = widgetPos.x + 'px';
            widgetRef.current.style.top = widgetPos.y + 'px';
        }
    }, [widgetPos, widgetState]);

    useEffect(() => {
        if (hidden) return
        const fetchInfo = async () => {
            try {
                const songRes = await fetch(`${API_URL}/songinfo`)
                if (!songRes.ok) throw new Error(`HTTP ${songRes.status}`)
                const songData = await songRes.json()
                setCurrentSong(songData)

                const now = Date.now()
                if (now - userActionTime.current.isPlaying > 3000) {
                    setIsPlaying(songData.is_playing)
                }
                if (now - userActionTime.current.isMuted > 3000) {
                    setIsMuted(songData.is_muted ?? false)
                }
                if (now - userActionTime.current.volume > 3000) {
                    setVolume(songData.volume ?? 75)
                }

                const statusRes = await fetch(`${API_URL}/status`)
                if (!statusRes.ok) throw new Error(`HTTP ${statusRes.status}`)
                const statusData = await statusRes.json()

                if (now - userActionTime.current.loopState > 3000) {
                    let loopMode = "none"
                    if (statusData.loop_state === "Playlist") loopMode = "playlist"
                    if (statusData.loop_state === "Song") loopMode = "song"
                    setLoopState(loopMode)
                    setSongLoopCount(
                        typeof statusData.loop_count === "number" ? statusData.loop_count : 1
                    )
                    setLoopsDone(statusData.loops_done || 0)
                } else {
                    setLoopsDone(statusData.loops_done || 0)
                }

                setBackendConnected(true)
                setError(null)
            } catch (e) {
                setBackendConnected(false)
                setError(`Backend not connected: ${e.message}`)
            }
        }

        fetchInfo()
        const interval = setInterval(fetchInfo, 2000)
        return () => clearInterval(interval)
    }, [hidden])

    useEffect(() => {
        if (window.widgetAPI && typeof window.widgetAPI.setWidgetState === 'function') {
            window.widgetAPI.setWidgetState(widgetState);
        }
    }, [widgetState]);

    const callBackend = async (endpoint, options = {}) => {
        const now = Date.now()
        const lastCall = lastApiCall.current[endpoint] || 0
        if (now - lastCall < 150) {
            return
        }
        lastApiCall.current[endpoint] = now
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000)
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...options.headers },
                signal: controller.signal,
                ...options,
            })
            clearTimeout(timeoutId)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            return result
        } catch (e) {
            if (e.name === "AbortError") {
                setError(`Request to ${endpoint} timed out`)
            } else {
                setError(`Failed to call ${endpoint}: ${e.message}`)
            }
        }
    }

    const handleWidgetMouseEnter = () => {
        // Only allow hover if currently minimized and no pending minimize timeout
        if (hoverTimeoutRef.current) {
            // If a minimize timeout is running, let it finish before allowing hover
            return;
        }
        handleInteraction(); // Reset auto-hide timer and show widget
        if (widgetState === "minimized") {
            setWidgetState("hover");
        }
    }

    const handleWidgetMouseLeave = () => {
        // Set a timeout to minimize after a short delay
        if (dragging) return; // Prevent minimize while dragging
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
            if (widgetState !== "minimized") {
                setWidgetState("minimized");
            }
            hoverTimeoutRef.current = null;
        }, 100);
    }

    const playPause = () => {
        setIsPlaying(!isPlaying)
        userActionTime.current.isPlaying = Date.now()
        callBackend("/playpause")
    }

    const previousTrack = () => {
        userActionTime.current.loopState = Date.now()
        callBackend("/prev")
    }

    const nextTrack = () => {
        userActionTime.current.loopState = Date.now()
        callBackend("/next")
    }

    const volumeUp = () => {
        setVolume((prev) => Math.min(100, prev + 10))
        userActionTime.current.volume = Date.now()
        callBackend("/volumeup")
    }

    const volumeDown = () => {
        setVolume((prev) => Math.max(0, prev - 10))
        userActionTime.current.volume = Date.now()
        callBackend("/volumedown")
    }

    const volumeMute = () => {
        setIsMuted(!isMuted)
        userActionTime.current.isMuted = Date.now()
        callBackend("/mute")
    }

    const loopStateToIndex = (state) => {
        if (state === "playlist") return 1
        if (state === "song") return 2
        return 0
    }

    const cycleLoopMode = () => {
        let newState = "none"
        if (loopState === "none") newState = "playlist"
        else if (loopState === "playlist") newState = "song"
        else newState = "none"
        // If leaving song mode, reset songLoopCount to 1
        if (loopState === "song" && newState !== "song") {
            setSongLoopCount(1)
        }
        setLoopState(newState)
        userActionTime.current.loopState = Date.now()
        callBackend("/loop", {
            body: JSON.stringify({
                state_index: loopStateToIndex(newState),
                loop_count: newState === "song" ? songLoopCount : 1,
            }),
        })
    }

    const increaseSongLoop = () => {
        setSongLoopCount((prev) => prev + 1)
        userActionTime.current.loopState = Date.now()
        callBackend("/loop", {
            body: JSON.stringify({
                state_index: loopStateToIndex(loopState),
                loop_count: songLoopCount + 1,
            }),
        })
    }

    const decreaseSongLoop = () => {
        setSongLoopCount((prev) => Math.max(0, prev - 1))
        userActionTime.current.loopState = Date.now()
        callBackend("/loop", {
            body: JSON.stringify({
                state_index: loopStateToIndex(loopState),
                loop_count: Math.max(0, songLoopCount - 1),
            }),
        })
    }

    const handleButtonClick = (action, buttonId, e) => {
        e.preventDefault()
        e.stopPropagation()
        handleInteraction(); // Reset auto-hide timer
        const now = Date.now()
        const lastClick = lastButtonClick.current[buttonId] || 0
        if (now - lastClick < 200) {
            return
        }
        lastButtonClick.current[buttonId] = now
        action()
    }

    // Remove any .cache or OAuth logic from frontend
    // If you want a login button, use this function:
    const triggerSpotifyLogin = async () => {
        window.open(`${API_URL}/spotify-auth`, '_blank', 'width=500,height=700');
    };

    return (
        <>
            {!hidden && (
                <WidgetContainer>
                    {/* Standalone StatusDot that stays visible when auto-hidden */}
                    <div
                        style={{
                            position: "absolute",
                            left: widgetPos.x + 8,
                            top: widgetPos.y + 14,
                            opacity: autoHidden ? 1 : 0,
                            transition: "opacity 0.6s ease",
                            pointerEvents: "none",
                            zIndex: 9998,
                        }}
                    >
                        <StatusDot isPlaying={isPlaying} />
                    </div>

                    {/* Minimized State */}
                    <MinimizedCard
                        ref={widgetState === 'minimized' ? widgetRef : null}
                        isVisible={widgetState === "minimized"}
                        autoHidden={autoHidden}
                        style={{
                            position: "absolute",
                            pointerEvents: widgetState === "minimized" ? "auto" : "none",
                            left: widgetPos.x,
                            top: widgetPos.y,
                        }}
                        onMouseEnter={handleWidgetMouseEnter}
                        onMouseDown={onWidgetMouseDown}
                    >
                        <StatusDot isPlaying={isPlaying} />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                minWidth: 0,
                                flex: 1,
                            }}
                        >
                            <SongTitle $hover={false}>
                                {currentSong && currentSong.title ? currentSong.title : "No Track Deteced"}
                            </SongTitle>
                            <ArtistName $hover={false}>{currentSong && currentSong.artist ? currentSong.artist : ""}</ArtistName>
                        </div>
                    </MinimizedCard>

                    {/* Hover State */}
                    <HoverCard
                        ref={widgetState === 'hover' ? widgetRef : null}
                        isVisible={widgetState === "hover"}
                        autoHidden={autoHidden}
                        style={{
                            position: "absolute",
                            pointerEvents: widgetState === "hover" ? "auto" : "none",
                            cursor: dragging ? "grabbing" : "grab",
                            left: widgetPos.x,
                            top: widgetPos.y,
                        }}
                        onMouseEnter={() => handleInteraction()} // Reset auto-hide timer on hover
                        onMouseLeave={handleWidgetMouseLeave}
                        onMouseDown={onWidgetMouseDown}
                    >
                        <SongInfo>
                            <StatusDot isPlaying={isPlaying} />
                            <SongTextContainer>
                                <SongTitle $hover={true}>
                                    {currentSong && currentSong.title ? currentSong.title : "No Track Detected"}
                                </SongTitle>
                                <ArtistName $hover={true}>{currentSong && currentSong.artist ? currentSong.artist : ""}</ArtistName>
                            </SongTextContainer>
                        </SongInfo>
                        <ControlsRow>
                            <TransitionGroup component={ControlsRow}>
                                <CSSTransition key="prev" timeout={300} classNames="push-btn">
                                    <ControlButton onMouseDown={(e) => handleButtonClick(previousTrack, "previousTrack", e)}>
                                        <SkipBack size={14} />
                                    </ControlButton>
                                </CSSTransition>
                                <CSSTransition key="playpause" timeout={300} classNames="push-btn">
                                    <ControlButton onMouseDown={(e) => handleButtonClick(playPause, "playPause", e)}>
                                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                    </ControlButton>
                                </CSSTransition>
                                <CSSTransition key="next" timeout={300} classNames="push-btn">
                                    <ControlButton onMouseDown={(e) => handleButtonClick(nextTrack, "nextTrack", e)}>
                                        <SkipForward size={14} />
                                    </ControlButton>
                                </CSSTransition>
                                <CSSTransition key="vol-down" timeout={300} classNames="push-btn">
                                    <ControlButton onMouseDown={(e) => handleButtonClick(volumeDown, "volumeDown", e)}>
                                        <Volume1 size={13} />
                                    </ControlButton>
                                </CSSTransition>
                                <CSSTransition key="vol-up" timeout={300} classNames="push-btn">
                                    <ControlButton onMouseDown={(e) => handleButtonClick(volumeUp, "volumeUp", e)}>
                                        <Volume2 size={13} />
                                    </ControlButton>
                                </CSSTransition>
                                <CSSTransition key="mute" timeout={300} classNames="push-btn">
                                    <VolumeButton muted={isMuted} onMouseDown={(e) => handleButtonClick(volumeMute, "volumeMute", e)}>
                                        <VolumeX size={13} />
                                    </VolumeButton>
                                </CSSTransition>
                                {loopState === "song" && (
                                    <CSSTransition key="minus" timeout={300} classNames="push-btn">
                                        <ControlButton onMouseDown={(e) => handleButtonClick(decreaseSongLoop, "decreaseSongLoop", e)}>
                                            <Minus size={13} />
                                        </ControlButton>
                                    </CSSTransition>
                                )}
                                <CSSTransition key="loop" timeout={300} classNames="push-btn">
                                    <LoopButton
                                        active={loopState !== "none"}
                                        onMouseDown={(e) => handleButtonClick(cycleLoopMode, "cycleLoopMode", e)}
                                    >
                                        <Repeat size={14} />
                                        {loopState === "song" && (
                                            <LoopCounter>
                                                {songLoopCount === 0 ? "∞" : Math.max(songLoopCount - loopsDone, 1)}
                                            </LoopCounter>
                                        )}
                                    </LoopButton>
                                </CSSTransition>
                                {loopState === "song" && (
                                    <CSSTransition key="plus" timeout={300} classNames="push-btn">
                                        <ControlButton onMouseDown={(e) => handleButtonClick(increaseSongLoop, "increaseSongLoop", e)}>
                                            <Plus size={13} />
                                        </ControlButton>
                                    </CSSTransition>
                                )}
                            </TransitionGroup>
                        </ControlsRow>
                        {error && (
                            <div
                                style={{
                                    color: "#ff6b6b",
                                    fontSize: 10,
                                    marginTop: 12,
                                    textAlign: "center",
                                    opacity: 0.7,
                                }}
                            >
                                Backend disconnected
                            </div>
                        )}
                    </HoverCard>
                </WidgetContainer>
            )}
        </>
    )
}

export default LoopifyApp
