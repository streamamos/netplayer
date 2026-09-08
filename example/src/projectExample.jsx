import React, { useState, useEffect, useMemo, useRef } from "react";
import { useCookies } from "react-cookie";
import { useLocation, useNavigate, Link } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase.js"; // Your Firestore instance
import { useStaffPermissions } from "../../context/StaffPermissionsContext";

import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/plyr/theme.css';
import { MediaPlayer, MediaProvider, Track, PlyrLayoutTranslations } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';

import servers from './servers.js';
import languageList from './languageList.js';
import bypassMovieIds from '../../bypassMovieIds.js';

import { AiOutlineStar, AiFillYoutube } from "react-icons/ai";
import { BiMoviePlay, BiTime, BiSkipNext, BiSkipPrevious, BiCommentError, BiSolidCameraMovie, BiCategoryAlt } from "react-icons/bi";
import { PiTelevisionSimpleBold, PiSealWarningFill, PiHighDefinitionFill } from "react-icons/pi";
import { FaRegComments, FaPlay, FaLightbulb, FaFileDownload } from "react-icons/fa";
import { RiInformationLine, RiSlideshow3Line, RiAwardLine, RiAdvertisementFill, RiSkipRightLine } from "react-icons/ri";
import { MdOutlineLanguage, MdOutlineFavoriteBorder, MdOutlineFavorite, MdSlideshow, MdDateRange, MdSource, MdMessage } from "react-icons/md";
import { HiOutlineStatusOnline } from "react-icons/hi";
import { BsQuestionCircleFill, BsQuestionCircl, BsFillCaretLeftFill, BsFillCaretRightFill, BsPauseFill, BsFillPlayFill, BsVolumeMuteFill, BsVolumeUpFill } from "react-icons/bs";
import { IoIosCheckmarkCircleOutline, IoMdInformationCircle, IoIosPerson } from "react-icons/io";
import { TiStarFullOutline, TiStarOutline, TiStarHalfOutline } from "react-icons/ti";
import { TbArrowsDownUp, TbMovie, TbServer, TbServerBolt, TbServerCog, TbBoxMultiple } from "react-icons/tb";
import { GoHome, GoDotFill } from "react-icons/go";
import { VscLibrary, VscFolderLibrary } from "react-icons/vsc";
import { LuLibrary, LuGalleryThumbnails } from "react-icons/lu";
import { IoArrowBack } from "react-icons/io5";
import { FaChevronDown, FaRegCopy, FaArrowRotateLeft } from "react-icons/fa6";
import { MdHd, MdPeople, Md4K } from "react-icons/md";
import { FaMagnet } from "react-icons/fa"
import { FaClosedCaptioning } from "react-icons/fa";
import { FaMicrophone } from "react-icons/fa";
import { ArrowDropDown } from '@mui/icons-material';
import { RxExternalLink } from "react-icons/rx";

import MovieCard from "./MovieCard";
import Skeleton from '@mui/material/Skeleton';
import Hls from "hls.js";

// import "video-react/dist/video-react.css";
// import "./customPlayer.css";
// import { Player } from 'video-react';

import { usePostHog } from '@posthog/react';

import NetPlayer, { Overlay } from "netplayer3";

import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";

import Utilities from "../../Utilities";

import styles from "./styles.module.scss";
import styles1 from "./slider.module.scss";
import stylesSlider from "../../Components/Slider/styles.module.scss";
import { API_ENDPOINTS } from "../../API/endpoints";

import Comments from '../../Components/Comments';

import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { styled } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Typography, Tabs, TableSortLabel, Snackbar } from '@mui/material';

import { FiDownload } from "react-icons/fi";
import { 
  Modal,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress
} from '@mui/material';

const SERVER_FETCH_PROGRESS_MS = 20000;
const SERVER_AUTO_SWITCH_DELAY_MS = 2000;
const TEASER_PREVIEW_DELAY_MS = 5000;

const CustomWidthTooltipSvMobile = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    width: 'auto',
    marginTop: '-5px!important',
    maxWidth: 'none',
    backgroundColor: 'var(--orange)',
    fontFamily: 'Mulish',
    color: 'var(--darkBlack)',
    fontSize: '15px',
    padding: 15,
    borderRadius: 10,
    boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 8px',
    marginRight: '5px!important',
  },
  '@media (max-width: 1024px)': {
    [`& .${tooltipClasses.tooltip}`]: {
      fontSize: '12px',
      padding: 10,
      maxWidth: 165,
    },
  },
  '@media (max-width: 550px)': {
    [`& .${tooltipClasses.tooltip}`]: {
      fontSize: '10px',
      padding: 8,
      maxWidth: 140,
    },
  },
});

const CustomWidthTooltipSv = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    width: 'auto',
    marginTop: '10px!important',
    maxWidth: 'none',
    backgroundColor: 'var(--orange)',
    fontFamily: 'Mulish',
    color: 'var(--darkBlack)',
    fontSize: '15px',
    padding: 15,
    borderRadius: 10,
    boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 8px',
  },
  '@media (max-width: 1024px)': {
    [`& .${tooltipClasses.tooltip}`]: {
      fontSize: '12px',
      padding: 10,
      maxWidth: 165,
    },
  },
  '@media (max-width: 550px)': {
    [`& .${tooltipClasses.tooltip}`]: {
      fontSize: '10px',
      padding: 8,
      maxWidth: 140,
    },
  },
});

const CustomWidthTooltip2 = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 700,
    backgroundColor: 'var(--orange)',
    fontFamily: 'Mulish',
    color: 'var(--darkBlack)',
    fontSize: '15px',
    padding: 15,
    borderRadius: 10,
    boxShadow: 'rgba(0, 0, 0, 0.16) 0px 1px 8px',
  },
  '@media (max-width: 1024px)': {
    display: 'none',
  },
});



function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}







export default function MovieDetails() {
  const user = auth.currentUser;
  const [authUserUid, setAuthUserUid] = useState(null);
  const staffPermissions = useStaffPermissions(authUserUid);
  const staffPermissionsRef = useRef(staffPermissions);
  useEffect(() => {
    staffPermissionsRef.current = staffPermissions;
  }, [staffPermissions]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthUserUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  const navigate = useNavigate();

  // Helper function to update URL parameters with season and episode
  // const updateUrlParams = (season, episode) => {
  //   const newUrlParams = new URLSearchParams(window.location.search);
  //   newUrlParams.set('s', season.toString());
  //   newUrlParams.set('e', episode.toString());
  //   const newUrl = `${window.location.pathname}?${newUrlParams.toString()}`;
  //   window.history.replaceState({}, '', newUrl);
  // };

  const posthog = usePostHog();
  const heartbeatRef = useRef(null);

  const hlsRef = useRef(null);
  const location = useLocation();
  const currentPath = location.pathname;
  const [movieDetails, setMovieDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(true);
  const [episode, setEpisode] = useState({});
  const [seasonData, setSeasonData] = useState({});
  const [fullSeasonData, setFullSeasonData] = useState({});
  const [query, setQuery] = useState(useQuery());
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false); // New state variable
  const [portugueseTitle, setPortugueseTitle] = useState(""); // New state variable
  const [poster, setPoster] = useState(""); // New state variable
  const [pngLogo, setPngLogo] = useState(null); // New state variable
  const [originalLang, setOriginalLang] = useState("");
  const [network, setNetwork] = useState("");
  const [status, setStatus] = useState("");
  const [portugueseDesc, setPortugueseDesc] = useState(""); // New state variable
  const [castInfo, setCastInfo] = useState([]);
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  const [crewInfo, setCrewInfo] = useState([]);
  const [backdropImage, setBackdropImage] = useState(null);
  const [backdropImageVisible, setBackdropImageVisible] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [trailerVideoId, setTrailerVideoId] = useState(null);
  const [trailerPlayer, setTrailerPlayer] = useState(null);
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const [showTrailerPreview, setShowTrailerPreview] = useState(false);
  const [youtubePreviewEnabled, setYoutubePreviewEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('youtubePreviewEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (error) {
      console.error('Error loading youtubePreviewEnabled from localStorage:', error);
      return true;
    }
  });
  const [teaserCycleKey, setTeaserCycleKey] = useState(0);
  const [keywords, setKeywords] = useState([]);
  const [imdb, setImdb] = useState(null);
  const [tmdbRating, setTmdbRating] = useState("TBD");
  const [releaseDateUS, setReleaseDateUS] = useState('');
  const [certificationUS, setCertificationUS] = useState(null);
  const [nextAirDate, setNextAirDate] = useState(null);
  const [totalEpisodes, setTotalEpisodes] = useState({});
  const [accordionStyle, setAccordionStyle] = useState('column');
  const [thumbnailStyle, setThumbnailStyle] = useState(() => localStorage.getItem('thumbnailStyle') || '');
  const [moreEpisodeInfo, setMoreEpisodeInfo] = useState(() => {
    const stored = localStorage.getItem('moreEpisodeInfo');
    if (stored === null) return false;
    return stored === 'true';
  });
  const [showNotLoading, setShowNotLoading] = useState(false);
  const [oneMoment, setOneMoment] = useState(false);
  const [movieResults, setMovieResults] = useState([]);
  const [showResults0, setShowResults0] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showResults2, setShowResults2] = useState(false);
  const [showResults3, setShowResults3] = useState(false);
  const [collectionTitle, setCollectionTitle] = useState("")
  const [backdropImageCollection, setBackdropImageCollection] = useState(null);
  const [collectionTitle2, setCollectionTitle2] = useState("")
  const [backdropImageCollection2, setBackdropImageCollection2] = useState(null);
  const [movieResults2, setMovieResults2] = useState([]);
  const [movieResults3, setMovieResults3] = useState([]);
  const [numMovies, setNumMovies] = useState(0);
  const [numShows, setNumShows] = useState(0);
  const [numShorts, setNumShorts] = useState(0);
  const [numMovies3, setNumMovies3] = useState(0);
  const [numShows3, setNumShows3] = useState(0);
  const [numMoviesSaga, setNumMoviesSaga] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showMovies, setShowMovies] = useState(true);
  const [showSeries, setShowSeries] = useState(true);
  const [showShorts, setShowShorts] = useState(false);
  const [showFilmes, setShowFilmes] = useState(true);
  const [showMovies3, setShowMovies3] = useState(true);
  const [showSeries3, setShowSeries3] = useState(true);
  const [value, setValue] = useState('3');
  const [showDivLoader, setShowDivLoader] = useState(false);
  const [awards, setAwards] = useState([]);
  const [imdbAwards, setImdbAwards] = useState(null);
  const [isAwards, setIsAwards] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  const [rightDivTabMovie, setRightDivTabMovie] = useState(0);
  const [rightDivTabSeries, setRightDivTabSeries] = useState(0);
  const [isManualServerSelection, setIsManualServerSelection] = useState(false);

  const [isMP4, setIsMP4] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const [openTooltip, setOpenTooltip] = useState(false);

  const [playerLog, setPlayerLog] = useState("");
  const [playerLogQuality, setPlayerLogQuality] = useState("");

  const [favorites, setFavorites] = useState([]);

  const [chunkLoadingInfo, setChunkLoadingInfo] = useState('');

  const handleTooltipClose = () => {
    setOpenTooltip(false);
  };

  const handleTooltipOpen = () => {
    setOpenTooltip(true);
    setTimeout(() => {
      setOpenTooltip(false);
    }, 3000);
  };

  const createMaybeWorkingServerStates = () =>
    Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [i + 1, 'maybeWorking'])
    );

  const [serverStates, setServerStates] = useState(createMaybeWorkingServerStates);
  const serverStatesRef = useRef(serverStates);

  const [subtitlesArray, setSubtitlesArray] = useState([]);

  const enabledServers = servers.filter((server) => server.isEnabled === true);
  const [filteredEnabledServers, setFilteredEnabledServers] = useState(enabledServers);
  const filteredEnabledServersRef = useRef(filteredEnabledServers);
  const [selectedServer, setSelectedServer] = useState(null);

  useEffect(() => {
    serverStatesRef.current = serverStates;
  }, [serverStates]);

  useEffect(() => {
    filteredEnabledServersRef.current = filteredEnabledServers;
  }, [filteredEnabledServers]);

  useEffect(() => {
    if (movieDetails?.type !== "TV Series") return;
    if (!episode?.season || !episode?.number) return;

    setServerStates(createMaybeWorkingServerStates());
  }, [episode?.id, episode?.season, episode?.number, movieDetails?.type]);

  /** After a failure, use the lowest list index that is not notWorking, then the next on each later failure (0 → 1 → 2 → …). */
  function pickNextServerAfterFailure() {
    const servers = filteredEnabledServersRef.current;
    const states = serverStatesRef.current;
    if (!servers?.length) return null;

    for (let i = 0; i < servers.length; i++) {
      const sn = servers[i]?.serverNumber;
      if (sn != null && states[sn] !== "notWorking") {
        return sn;
      }
    }

    return null;
  }

  const [isServerAutoSwitchPending, setIsServerAutoSwitchPending] = useState(false);
  const serverAutoSwitchTimeoutRef = useRef(null);

  const clearServerAutoSwitchPending = () => {
    if (serverAutoSwitchTimeoutRef.current) {
      clearTimeout(serverAutoSwitchTimeoutRef.current);
      serverAutoSwitchTimeoutRef.current = null;
    }
    setIsServerAutoSwitchPending(false);
  };

  const scheduleAutoServerSwitch = () => {
    clearServerAutoSwitchPending();
    setIsServerAutoSwitchPending(true);
    serverAutoSwitchTimeoutRef.current = setTimeout(() => {
      serverAutoSwitchTimeoutRef.current = null;
      setIsServerAutoSwitchPending(false);
      setSelectedServer((prev) => pickNextServerAfterFailure() ?? prev);
    }, SERVER_AUTO_SWITCH_DELAY_MS);
  };

  const [isStillFetching, setIsStillFetching] = useState(true);
  const [embedUrls, setEmbedUrls] = useState([]);
  const [embedUrls2, setEmbedUrls2] = useState([]);
  const [sourceUnavailable, setSourceUnavailable] = useState(false);

  const [isServerLoading, setIsServerLoading] = useState(false);

  // Add state for current server name and animation
  const [currentServerName, setCurrentServerName] = useState("");
  const [isServerNameAnimating, setIsServerNameAnimating] = useState(false);
  const [serverFetchProgress, setServerFetchProgress] = useState(0);

  const selectedEpisodeRef = useRef(null);
  const seasonsListRef = useRef(null);
  const seasonTabRefs = useRef({});
  const prevWindowWidthForSeasonScrollRef = useRef(window.innerWidth);
  const prevWindowWidthForSeasonTabRef = useRef(window.innerWidth);

  const videoRef = useRef(null);
  const videoElementRef = useRef(null);

  const playerRef = useRef(null);

  const eventListenersRef = useRef([]);
  const cleanupRef = useRef(null);
  const playerRefs = useRef(null);
  const initialTimeSetRef = useRef(false);
  const userDataFetchedRef = useRef(false);
  const trailerContainerRef = useRef(null);
  const trailerPlayerTimeoutRef = useRef(null);
  const teaserDelayTimeoutRef = useRef(null);
  const teaserEndingRef = useRef(false);
  const trailerPlayerRef = useRef(null);

  const [isIOS, setIsIOS] = useState(false);

  const [isNextEpisodeOverlay, setIsNextEpisodeOverlay] = useState(false);
  const [hasUserDismissedOverlay, setHasUserDismissedOverlay] = useState(false); 

  const [skipSegments, setSkipSegments] = useState(null);
  const [currentSkipSegment, setCurrentSkipSegment] = useState(null);
  const lastSkipCheckTimeRef = useRef(0);

  const [iframeProgress, setIframeProgress] = useState(0);
  const [showIframeWarning, setShowIframeWarning] = useState(true);

  const [isOverflowing, setIsOverflowing] = useState(false);

  const [activeSeason, setActiveSeason] = useState(0);
  const [manualSelection, setManualSelection] = useState(false);

  const handleActiveSeason = (event, newValue) => {
    setManualSelection(true);
    setActiveSeason(newValue);
  };

  const selectedMovieCardRef = useRef(null);
  const movieCardListRef = useRef(null);
  const currentFetchController = useRef(null);
  const subtitlesAbortControllerRef = useRef(null);
  const lastFetchedSubtitleKeyRef = useRef(null);
  const serversListRef = useRef(null);
  const serverButtonRefs = useRef({});

  const [openDownloadModal, setOpenDownloadModal] = useState(false);
  const [downloadModeChoice, setDownloadModeChoice] = useState(null); // null | 'torrent' | 'direct'
  const [downloadData, setDownloadData] = useState(null);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);

  const [sortBy, setSortBy] = useState('quality');
  const [sortDirection, setSortDirection] = useState('desc');
  const [directSortBy, setDirectSortBy] = useState('quality');
  const [directSortDirection, setDirectSortDirection] = useState('desc');
  const [showPulseButton, setShowPulseButton] = useState(false);




  const useWindowWidth = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
    useEffect(() => {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
  
      window.addEventListener('resize', handleResize);
  
      return () => {
        try {
          window.removeEventListener('resize', handleResize);
        } catch (e) {
          console.warn('Error removing window resize listener:', e);
        }
      };
    }, []);
  
    return windowWidth;
  };
  

  // const [resizeNoticeVisible, setResizeNoticeVisible] = useState(false);
  // const lastResizeWidthRef = useRef(window.innerWidth);
  const windowWidth = useWindowWidth();
  const isPreExpanded = windowWidth >= 10025; // alterar para 1025 para voltar as temporadas expandidas


  // Show a snackbar when the window crosses the 1024px breakpoint (desktop/mobile boundary)
  // and let the user decide if they want to reload.
  // useEffect(() => {
  //   const handleResizeReload = () => {
  //     const prevWidth = lastResizeWidthRef.current;
  //     const currentWidth = window.innerWidth;

  //     const crossedBreakpoint =
  //       (prevWidth < 1025 && currentWidth >= 1025) ||
  //       (prevWidth >= 1025 && currentWidth < 1025);

  //     lastResizeWidthRef.current = currentWidth;

  //     if (!crossedBreakpoint) {
  //       return;
  //     }

  //     setResizeNoticeVisible(true);
  //   };

  //   window.addEventListener('resize', handleResizeReload);

  //   return () => {
  //     try {
  //       window.removeEventListener('resize', handleResizeReload);
  //     } catch (e) {
  //       console.warn('Error removing reload resize listener:', e);
  //     }
  //   };
  // }, []);

  const nextEpisodeOverlay = () => {
    handleNextEpisode(); // This hides the div
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const handleSkipSegment = () => {
    lastSkipCheckTimeRef.current = 0;
    if (currentSkipSegment && currentSkipSegment.end) {
      if (videoRef.current) {
        videoRef.current.currentTime = currentSkipSegment.end;
      } else if (playerRef.current) {
        playerRef.current.currentTime = currentSkipSegment.end;
      }
      setCurrentSkipSegment(null);
    }
  };


  const toggleCinemaMode = () => {
    setIsCinemaMode((prev) => !prev);
    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const toggleYoutubePreview = () => {
    const newValue = !youtubePreviewEnabled;
    setYoutubePreviewEnabled(newValue);
    try {
      localStorage.setItem('youtubePreviewEnabled', JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving youtubePreviewEnabled to localStorage:', error);
    }
  };

  const handleVisibleClick = () => {
    setIsVisible(false); // This hides the div
  };

  const restartTeaserCycle = () => {
    setShowTrailerPreview(false);
    setTeaserCycleKey((key) => key + 1);
  };

  const handleTeaserEnded = () => {
    if (teaserEndingRef.current) return;
    teaserEndingRef.current = true;
    cleanupTrailerPlayer();
    restartTeaserCycle();
  };

  const cleanupTrailerPlayer = () => {
    if (trailerPlayerTimeoutRef.current) {
      clearTimeout(trailerPlayerTimeoutRef.current);
      trailerPlayerTimeoutRef.current = null;
    }

    if (teaserDelayTimeoutRef.current) {
      clearTimeout(teaserDelayTimeoutRef.current);
      teaserDelayTimeoutRef.current = null;
    }

    if (trailerPlayerRef.current) {
      try {
        trailerPlayerRef.current.stopVideo();
      } catch (e) {
        console.log("Could not stop trailer video:", e);
      }

      try {
        trailerPlayerRef.current.destroy();
      } catch (e) {
        console.log("Could not destroy trailer player:", e);
      }

      trailerPlayerRef.current = null;
      setTrailerPlayer(null);
    }

    if (trailerContainerRef.current) {
      trailerContainerRef.current.replaceChildren();
    }

    setTrailerPlaying(false);
    setTrailerMuted(true);
  };

  const createTrailerPlayer = () => {
    if (!trailerContainerRef.current || !trailerVideoId) return;

    teaserEndingRef.current = false;

    if (!window.YT || !window.YT.Player) {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === "function") prevReady();
        createTrailerPlayer();
      };
      return;
    }

    const container = trailerContainerRef.current;
    container.replaceChildren();

    const playerDiv = document.createElement("div");
    container.appendChild(playerDiv);

    try {
      const newPlayer = new window.YT.Player(playerDiv, {
        videoId: trailerVideoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          showinfo: 0,
          rel: 0,
          enablejsapi: 1,
          disablekb: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => {
            const ytPlayer = event.target;
            trailerPlayerRef.current = ytPlayer;
            setTrailerPlayer(ytPlayer);
            setTrailerPlaying(true);
            setTrailerMuted(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              handleTeaserEnded();
            }
          },
          onError: (event) => {
            console.log("Teaser YouTube player error:", event);
            handleTeaserEnded();
          },
        },
      });

      trailerPlayerRef.current = newPlayer;
      setTrailerPlayer(newPlayer);
    } catch (e) {
      console.error("Error creating trailer YouTube player:", e);
      cleanupTrailerPlayer();
    }
  };

  const toggleTrailerPlay = () => {
    const player = trailerPlayerRef.current;
    if (!player) return;

    try {
      if (trailerPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      setTrailerPlaying(!trailerPlaying);
    } catch (e) {
      console.error("Error toggling trailer play state:", e);
    }
  };

  const toggleTrailerMute = () => {
    const player = trailerPlayerRef.current;
    if (!player) return;

    try {
      if (trailerMuted) {
        player.unMute();
        player.setVolume(5);
      } else {
        player.mute();
      }
      setTrailerMuted(!trailerMuted);
    } catch (e) {
      console.error("Error toggling trailer mute state:", e);
    }
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const targetNode = document.head || document.body;
      if (targetNode) {
        targetNode.appendChild(tag);
      }
    }

    return () => {
      cleanupTrailerPlayer();
    };
  }, []);

  useEffect(() => {
    const shouldRunTeaserCycle = isVisible && windowWidth >= 1025 && trailerVideoId && youtubePreviewEnabled;

    if (!shouldRunTeaserCycle) {
      setShowTrailerPreview(false);
      cleanupTrailerPlayer();
      return;
    }

    let cancelled = false;

    setShowTrailerPreview(false);
    cleanupTrailerPlayer();

    teaserDelayTimeoutRef.current = setTimeout(() => {
      teaserDelayTimeoutRef.current = null;
      if (cancelled) return;
      setShowTrailerPreview(true);
      trailerPlayerTimeoutRef.current = setTimeout(() => {
        trailerPlayerTimeoutRef.current = null;
        if (!cancelled) createTrailerPlayer();
      }, 50);
    }, TEASER_PREVIEW_DELAY_MS);

    return () => {
      cancelled = true;
      setShowTrailerPreview(false);
      cleanupTrailerPlayer();
    };
  }, [isVisible, windowWidth, trailerVideoId, teaserCycleKey, youtubePreviewEnabled]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const getLabelColor = (label) => {
    const colors = {
      "Original":           "#ffa31a",
      "Inglês":             "#1a6fff",
      "Português":          "#1abf4f",
      "Original/Inglês":    "#1ac4c4",
      "Original/Português": "#a3c41a",
      "Original/Outras":    "#8b1aff",
      "Inglês/Outras":      "#1ac4c4",
    };
    return colors[label] ?? "#ffa31a";
  };
  
  const renderRightDivServerButtons = () => {
    const getServerSection = (server) => {
      if (server.serverName === "embed") return "embed";

      const audio = (server.audio || "").toLowerCase();
      if (audio === "sub") return "sub";
      if (audio === "dub") return "dub";

      return "main";
    };

    const orderedSections = ["sub", "dub", "main", "embed"];
    const orderedServers = orderedSections.flatMap((section) =>
      filteredEnabledServers.filter((server) => getServerSection(server) === section)
    );

    return orderedServers.map((server, idx) => {
      const currentSection = getServerSection(server);
      const previousSection = idx > 0 ? getServerSection(orderedServers[idx - 1]) : null;
      const shouldRenderDivider = previousSection !== currentSection;
      const sectionTitles = {
        sub: "Sub",
        dub: "Dub",
        main: "Principais",
        embed: "Embeds",
      };
      const labelColor = getLabelColor(server.label);

      return (
        <React.Fragment key={server.serverNumber}>
          {shouldRenderDivider && (
            <div className={styles.serverDivider}>
              <p>{sectionTitles[currentSection]}</p>
            </div>
          )}
          <button
            key={server.serverNumber}
            ref={(el) => {
              serverButtonRefs.current[server.serverNumber] = el;
            }}
            onClick={() => handleServerClick(server.serverNumber)}
            className={`${styles.serversButtons} ${selectedServer === server.serverNumber ? styles.activeServer : ""}`}
            disabled={(Object.values(serverStates).includes("loading") || isServerAutoSwitchPending) && !staffPermissions.hasServersInfo}
          >
          <div className={styles.serversImgGroup}>
          <img
            src="/backupbacksv.svg"
            className={`${styles.serversImg} ${selectedServer === server.serverNumber ? styles.activeServerImg : ""}`}
            style={{ backgroundColor: selectedServer === server.serverNumber ? labelColor : "var(--orange)" }}
            alt={server.name}
          />
          </div>
            {server.providerUrl ? (
              <>
                <div>
                  <RiAdvertisementFill size={16} /> {server.name}
                </div>
                <p>
                  <FaMicrophone style={{ color: "var(--orange)" }} size={10} /> {server.label}
                  {staffPermissions.hasServersInfo && windowWidth >= 1025 && (
                    <>
                      <MdSource style={{ color: "var(--orange)", marginLeft: "5px" }} size={12} /> {server.providerName}:{server.serverName}
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <div>
                  <TbServerBolt size={16} /> {server.name}
                </div>
                <p>
                  <FaMicrophone style={{ color: "var(--orange)" }} size={10} /> {server.label}
                  {staffPermissions.hasServersInfo && windowWidth >= 1025 && (
                    <>
                      <MdSource style={{ color: "var(--orange)", marginLeft: "5px" }} size={12} /> {server.providerName}:{server.serverName}
                    </>
                  )}
                </p>
              </>
            )}

            {serverStates[server.serverNumber] === "loading" ? (
              <div className={styles.serverLoadingDot} />
            ) : serverStates[server.serverNumber] === "working" ? (
              <div
                className={
                  server.serverName === "embed"
                    ? styles.serverWorkingDotEmbed
                    : styles.serverWorkingDot
                }
              >
                <GoDotFill size={20} />
              </div>
            ) : serverStates[server.serverNumber] === "notWorking" ? (
              <div className={styles.serverNotWorkingDot}>
                <GoDotFill size={20} />
              </div>
            ) : (
              <div className={styles.serverMaybeWorkingDot}>
                <GoDotFill size={20} />
              </div>
            )}
          </button>
        </React.Fragment>
      );
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(movieDetails.title);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  useEffect(() => {
    const movieHasReleaseInfo =
      movieDetails.type === "Movie" && releaseDateUS != null && releaseDateUS !== "";
    const serversListVisible =
      (movieDetails.type === "Movie" &&
        (movieHasReleaseInfo ? rightDivTabMovie === 1 : true)) ||
      (movieDetails.type === "TV Series" && rightDivTabSeries === 1);

    if (
      serversListVisible &&
      serverButtonRefs.current[selectedServer] &&
      serversListRef.current
    ) {
      const parent = serversListRef.current;
      const child = serverButtonRefs.current[selectedServer];
      const scrollTop = child.offsetTop - parent.offsetTop - 30;
      parent.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }, [selectedServer, movieDetails.type, releaseDateUS, rightDivTabMovie, rightDivTabSeries]);

  // Function to get current server name
  const getCurrentServerName = () => {
    if (selectedServer && filteredEnabledServers.length > 0) {
      const currentServer = filteredEnabledServers.find(server => server.serverNumber === selectedServer);
      if (staffPermissions.hasServersInfo) {
        return currentServer ? `${currentServer.name} (${currentServer.providerName}/${currentServer.serverName})` : "";
      } else {
        return currentServer ? `${currentServer.name}` : "";
      }

    }
    return "";
  };

  // Update current server name when selected server changes
  useEffect(() => {
    const newServerName = getCurrentServerName();
    if (newServerName !== currentServerName) {
      setIsServerNameAnimating(true);
      setCurrentServerName(newServerName);
      // Reset animation after transition
      setTimeout(() => {
        setIsServerNameAnimating(false);
      }, 300);
    }
  }, [selectedServer, filteredEnabledServers]);

  useEffect(() => {
    if (!isStillFetching && !isVisible) {
      setServerFetchProgress(0);
      return;
    }

    setServerFetchProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / SERVER_FETCH_PROGRESS_MS) * 100));
      setServerFetchProgress(pct);
      if (pct >= 100) return;
    };
    tick();
    const id = setInterval(tick, 100);

    return () => clearInterval(id);
  }, [isStillFetching, selectedServer, isVisible]);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Check for iOS devices, including iPads
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isIPadOS = navigator.userAgent.includes('Macintosh') && 'ontouchend' in document;
  
    if (isIOS || isIPadOS) {
      setIsIOS(true);
    }

    // if (/firefox|fxios/i.test(userAgent)) {
    //   setIsIOS(true);
    // }
  }, []);

  const fetchUserData = async () => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData;
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('thumbnailStyle', thumbnailStyle);
  }, [thumbnailStyle]);

  useEffect(() => {
    localStorage.setItem('moreEpisodeInfo', moreEpisodeInfo);
  }, [moreEpisodeInfo]);


  function formatReleaseDateFull(inputDate) {
    if (inputDate) {
      const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
    
      const dateParts = inputDate.split('-');
      if (dateParts.length === 3) {
        const day = dateParts[2];
        const monthIndex = parseInt(dateParts[1]) - 1; // Subtract 1 because months are 0-based
        const year = dateParts[0];
        const monthAbbreviation = months[monthIndex];
    
        return `${day} ${monthAbbreviation}. ${year}`;
      }
    } else {
          return inputDate; // Return the input if it's not in the expected format
    }

  }

  useEffect(() => {
    const fetchAndUpdateFavorites = async (currentUser) => {
      if (!currentUser || movieDetails.id <= 0) return;
      
      try {
        const userFavoritesRef = doc(db, "users", currentUser.uid);
        const docSnapshot = await getDoc(userFavoritesRef);
        const favoritesData = docSnapshot.exists() ? docSnapshot.data().userFavorites || [] : [];
        setFavorites(favoritesData);
        setIsFavorited(favoritesData.some(movie => movie.id === movieDetails.id));
      } catch (error) {
        console.error("Error fetching favorites:", error.message);
        setFavorites([]);
        setIsFavorited(false);
      }
    };
  
    const unsubscribe = onAuthStateChanged(auth, fetchAndUpdateFavorites);
    return () => unsubscribe();
  }, [movieDetails.id]);
  
  

  useEffect(() => {
    if (movieDetails.id > 0) {

    const savedData = JSON.parse(localStorage.getItem(`savedHistoryDataV1_${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`));
    const savedNetplayerSettings = JSON.parse(localStorage.getItem(`netplayer_video_settings`));
    
     const fetchData = async () => {
       try {

        // THIS FIXES THE NETPLAYER NOT GETTING THE SAVED TIME
        if (savedNetplayerSettings && savedNetplayerSettings.currentQuality !== null) {
          savedNetplayerSettings.currentQuality = null;
          localStorage.setItem('netplayer_video_settings', JSON.stringify(savedNetplayerSettings));
        }

        const response = await fetch('https://gist.githubusercontent.com/streamamos/2d3af8de9a9b8b8f34ac7b29641929dc/raw');
        const data = await response.json();
        const excludedAnimeProviders = ["tugaflix", "phim", "allmovieland", "tugakids", "moviesapi", "novelaspt", "ketaflix"];
        const animeKeywordId = 210024;
        
        const hasAnimeKeyword = (movieDetails.keywords?.results || []).some(
          k => k.id === animeKeywordId
        );
        
        const isAnime =
          hasAnimeKeyword ||
          (
            movieDetails.genres.includes("Animation") &&
            (
              movieDetails.original_language === "ja" ||
              movieDetails.original_language === "zh" ||
              movieDetails.original_language === "cn" ||
              movieDetails.original_language === "ko"
            )
          );
        
        const isPortuguese = movieDetails.original_language === "pt";
        
        const isTugakids = data.sources.some(
          (source) => source.id === movieDetails.id
        );
        
        const filteredEnabled = enabledServers.filter((server) => {
          // Hide bestseries for movies
          if (
            movieDetails.type === "Movie" &&
            server.providerName === "bestseries"
          ) {
            return false;
          }
        
          if (isAnime) {
            return (
              server.isEnabled === true &&
              !excludedAnimeProviders.includes(server.providerName)
            );
          }
        
          // For Portuguese content, include novelaspt, otherwise exclude it
          if (server.providerName === "novelaspt") {
            return server.isEnabled === true && isPortuguese;
          }
        
          if (server.providerName === "tugakids") {
            return server.isEnabled === true && isTugakids;
          }
        
          return (
            server.isEnabled === true &&
            !server.hasOwnProperty("audio")
          );
        });
        
        setFilteredEnabledServers(filteredEnabled);


          const serverParam = (urlParams.get('server') || '').trim().toLowerCase();
          const urlSelectedServer = serverParam
            ? filteredEnabled.find((server) => {
                const serverName = (server.name || '').toLowerCase();
                const providerName = (server.providerName || '').toLowerCase();
                return (
                  serverName === serverParam ||
                  providerName === serverParam ||
                  server.serverNumber?.toString() === serverParam
                );
              })
            : null;

          if (urlSelectedServer) {
            setSelectedServer(urlSelectedServer.serverNumber);
          } else if (savedData && savedData.selectedServer) {
            const selectedServerObj = filteredEnabled.find(server => server.serverNumber === savedData.selectedServer);
            
            // If the selected server is disabled, set to the first enabled server
            if (selectedServerObj && selectedServerObj.isEnabled === false) {
              setSelectedServer(filteredEnabled[0]?.serverNumber);
            } else if (!selectedServerObj) {
              // Handle case where saved server doesn't exist in filtered list
              setSelectedServer(filteredEnabled[0]?.serverNumber);
            } else {
              setSelectedServer(savedData.selectedServer);
            }
          } else {
            setSelectedServer(filteredEnabled[0]?.serverNumber);
          }

      
       } catch (error) {
         console.error('Error fetching data:', error);
       }
     };

     fetchData();
     
  }
  }, [movieDetails]);


useEffect(() => {
  if (movieDetails.seasons && movieDetails.seasons.length > 0) {
    const seasonsData = {};
    movieDetails.seasons.forEach((season) => {
      seasonsData[season.season_number] = season.episode_count;
    });
    setTotalEpisodes(seasonsData);
  }
}, [movieDetails]);


const handleButtonFavoriteClick = async () => {
  if (!user) return;

  try {
    const movie = {
      title: movieDetails.title,
      releaseDate: movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : "N/A",
      releaseDateFull: movieDetails.releaseDate,
      type: movieDetails.type,
      id: movieDetails.id,
      image: movieDetails.image.replace(`${API_ENDPOINTS.TMDB_IMG_URL}w185`, ""),
      originalType: movieDetails.originalType,
      media_type: movieDetails.originalType,
      overview: movieDetails.description,
      vote_average: movieDetails.rating,
      genres: movieDetails.genres_ids
    };

    // Work with the local state instead of fetching again
    const newFavorites = [...favorites];
    const index = newFavorites.findIndex(
      (fav) => fav.title === movie.title && fav.releaseDate === movie.releaseDate
    );

    if (index !== -1) {
      newFavorites.splice(index, 1);
      setIsFavorited(false);
    } else {
      newFavorites.push(movie);
      setIsFavorited(true);
    }

    // Update local state first for immediate UI feedback
    setFavorites(newFavorites);
    
    // Then update Firestore
    await setDoc(doc(db, "users", user.uid), { 
      userFavorites: newFavorites 
    }, { merge: true });
    
    // Set Firestore changed flag since we modified the database
    localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
    
    console.log("Favorites updated in Firestore!");
  } catch (error) {
    // Revert local state if Firestore update fails
    setFavorites(favorites);
    setIsFavorited(!isFavorited);
    console.error("Error updating favorites:", error.message);
  }
};


  // const handleButtonFavoriteClick = async () => {
  //   // Get the movie details from your component's state
  //   const { id, type, originalType, title, image, releaseDate } = movieDetails;

  //   // Create an object with the desired properties
  //   const movie = {
  //     title,
  //     releaseDate: releaseDate.substring(0, 4),
  //     type,
  //     id,
  //     image: image.replace(`${API_ENDPOINTS.TMDB_IMG_URL}w185`, ""),
  //     originalType,
  //     media_type: movieDetails.originalType,
  //     overview: movieDetails.description,
  //     vote_average: movieDetails.rating,
  //     genres: movieDetails.genres_ids
  //   };

  //   if (user) {
  //     // Firestore handling for logged-in users
  //     try {
  //       const userFavoritesRef = doc(db, "users", user.uid);
  //       const docSnapshot = await getDoc(userFavoritesRef);
    
  //       let favorites = docSnapshot.exists() ? docSnapshot.data().userFavorites || [] : [];
    
  //       const index = favorites.findIndex(
  //         (fav) => fav.title === movie.title && fav.releaseDate === movie.releaseDate
  //       );
  
  //       if (index !== -1) {
  //         favorites.splice(index, 1); // Remove if it exists
  //         setIsFavorited(false);
  //       } else {
  //         favorites.push(movie); // Add if it doesn't exist
  //         setIsFavorited(true);
  //       }
  
  //       await setDoc(userFavoritesRef, { "userFavorites": favorites  }, { merge: true });
  //       console.log("Favorites updated in Firestore!");
  //     } catch (error) {
  //       console.error("Error updating favorites in Firestore:", error.message);
  //     }
  //   } 
  //   // else {
  //   //   // LocalStorage handling for non-logged-in users
  //   //   const storedMovies = JSON.parse(localStorage.getItem("FavoritesV1")) || [];
  
  //   //   const index = storedMovies.findIndex(
  //   //     (storedMovie) => storedMovie.title === movie.title && storedMovie.releaseDate === movie.releaseDate
  //   //   );
  
  //   //   if (index !== -1) {
  //   //     storedMovies.splice(index, 1); // Remove if it exists
  //   //     setIsFavorited(false);
  //   //   } else {
  //   //     storedMovies.push(movie); // Add if it doesn't exist
  //   //     setIsFavorited(true);
  //   //   }
  
  //   //   localStorage.setItem("FavoritesV1", JSON.stringify(storedMovies));
  //   // }
  // };


 // Function to translate the genre
 function translateGenre(genre) {
  switch (genre) {
    case "Action":
      return "Ação";
    case "Animation":
      return "Animação";
    case "Crime":
      return "Crime";
    case "Family":
      return "Família";
    case "Horror":
      return "Terror";
    case "Mystery":
      return "Mistério";
    case "Romance":
      return "Romance";
    case "Soap":
      return "Novela";
    case "TV Movie":
      return "Cinema TV";
    case "Western":
      return "Faroeste";
    case "Action & Adventure":
      return "Ação & Aventura";
    case "Biography":
      return "Biografia";
    case "Documentary":
      return "Documentário";
    case "Fantasy":
      return "Fantasia";
    case "Kids":
      return "Crianças";
    case "News":
      return "Notícias";
    case "Sci-Fi & Fantasy":
      return "Sci-Fi & Fantasia";
    case "Talk":
      return "Talk-Show";
    case "War":
      return "Guerra";
    case "Adventure":
      return "Aventura";
    case "Comedy":
      return "Comédia";
    case "Drama":
      return "Drama";
    case "History":
      return "História";
    case "Music":
      return "Música";
    case "Reality":
      return "Reality-Show";
    case "Science Fiction":
      return "Ficção Científica";
    case "Thriller":
      return "Suspense";
    case "War & Politics":
      return "Guerra & Política";
    case "Politics":
      return "Política";
    default:
      return genre;
  }
}

const extractDuration = (durationString) => {
  const minutes = parseInt(durationString); // Extract the numerical value from the string
  if (!isNaN(minutes)) {
    const hours = Math.floor(minutes / 60); // Calculate the hours
    const remainingMinutes = minutes % 60; // Calculate the remaining minutes
    
    if (hours < 1) {
      return `${remainingMinutes}min`;
    }

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}min`; // Format the duration as "hours min"
  }

  return 'N/A';
};


function formatDate(airDate) {
  if (!airDate) return "N/A";
  const [year, month, day] = airDate.split("-");
  return `${day}-${month}-${year}`;
}


  const toggleAccordionStyle = () => {
    setAccordionStyle(prevStyle => prevStyle === 'column' ? 'column-reverse' : 'column');
  };

  const toggleThumbnailStyle = () => {
    setThumbnailStyle(prevStyle => prevStyle === '' ? 'none' : '');
  };

  const toggleEpisodeInfo = () => {
    setMoreEpisodeInfo(prevStyle => prevStyle === false ? true : false);
  };


  useEffect(() => {
      const runEffect = () => {
      if (selectedEpisodeRef.current && seasonsListRef.current) {


        const containerRect = seasonsListRef.current.getBoundingClientRect();
        const elementRect = selectedEpisodeRef.current.getBoundingClientRect();
    
        // Calculate the new scroll positions
        const topScroll =
          elementRect.top - containerRect.top + seasonsListRef.current.scrollTop - 5;
        const leftScroll =
          elementRect.left - containerRect.left + seasonsListRef.current.scrollLeft - 5;
    
        // Smooth scroll to the calculated position
        seasonsListRef.current.scrollTo({
          top: topScroll,
          left: leftScroll,
          behavior: 'smooth',
        });
    
        setManualSelection(false);

      } else if (seasonsListRef.current) {
        // Reset to top-left if no selection
        if (!manualSelection) {
          const { season } = episode;
          setActiveSeason(season - 1);
        }
        seasonsListRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
        setManualSelection(false);
      }
    };

      const widthChanged = prevWindowWidthForSeasonScrollRef.current !== windowWidth;
      prevWindowWidthForSeasonScrollRef.current = windowWidth;

      if (widthChanged) {
        const timeoutId = setTimeout(runEffect, 500);
        return () => clearTimeout(timeoutId);
      }

      runEffect();
  }, [episode, isVisible, activeSeason, windowWidth, rightDivTabMovie, rightDivTabSeries]);

  useEffect(() => {
    const runEffect = () => {
      const activeSeasonTab = seasonTabRefs.current[activeSeason];
      if (!activeSeasonTab) return;

      const tabsRoot = activeSeasonTab.closest('.MuiTabs-root');
      const tabsScroller = tabsRoot?.querySelector('.MuiTabs-scroller');
      if (!tabsScroller) return;

      const scrollerRect = tabsScroller.getBoundingClientRect();
      const tabRect = activeSeasonTab.getBoundingClientRect();
      const targetLeft =
        tabRect.left - scrollerRect.left + tabsScroller.scrollLeft - (scrollerRect.width / 2) + (tabRect.width / 2);

      tabsScroller.scrollTo({
        left: Math.max(targetLeft, 0),
        behavior: 'smooth',
      });
    };

    const widthChanged = prevWindowWidthForSeasonTabRef.current !== windowWidth;
    prevWindowWidthForSeasonTabRef.current = windowWidth;

    if (widthChanged) {
      const timeoutId = setTimeout(runEffect, 500);
      return () => clearTimeout(timeoutId);
    }

    runEffect();
  }, [activeSeason, isVisible, windowWidth, rightDivTabMovie, rightDivTabSeries]);
  


  useEffect(() => {
    if (!selectedMovieCardRef.current || !movieCardListRef.current) return;
  
    const containerRect = movieCardListRef.current.getBoundingClientRect();
    const elementRect = selectedMovieCardRef.current.getBoundingClientRect();
  
    if (containerRect && elementRect) {
      const scrollPosition =
        elementRect.left - containerRect.left + movieCardListRef.current.scrollLeft - 50;
  
      movieCardListRef.current.scrollTo({
        left: scrollPosition, // Use 'left' for horizontal scrolling
        behavior: 'smooth',
      });
    }
  }, [value, showResults2, movieResults2, showResults, movieResults, showMovies, showSeries, showShorts]);
  
  

  useEffect(() => {
    setSubtitlesArray([]);
    lastFetchedSubtitleKeyRef.current = null;
  }, [episode]);

// Fetch skip segments (intro/recap/credits) for TV Series
useEffect(() => {
  lastSkipCheckTimeRef.current = 0;
  setCurrentSkipSegment(null);

  if (movieDetails.type !== "TV Series" || !episode || !episode.season || !episode.number || !movieDetails.id || isVisible) {
    setSkipSegments(null);
    return;
  }

  const CACHE_KEY_PREFIX = "skipsegments_";
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const cacheKey = `${CACHE_KEY_PREFIX}${movieDetails.id}_s${episode.season}_e${episode.number}`;

  const fetchAndCacheSkipSegments = async () => {
    try {
      const response = await fetch(
        `https://api.theintrodb.org/v2/media?tmdb_id=${movieDetails.id}&season=${episode.season}&episode=${episode.number}`
      );

      if (!response.ok) {
        setSkipSegments(null);
        return;
      }

      const data = await response.json();

      // Validate it's the correct episode
      if (
        !data ||
        data.season !== episode.season ||
        data.episode !== episode.number
      ) {
        setSkipSegments(null);
        return;
      }

      // Normalize (your existing logic)
      const normalizeSegment = (segment) => {
        if (!segment) return null;
        if (Array.isArray(segment)) return segment[0] ?? null;
        return segment;
      };

      const normalized = {
        ...data,
        intro: normalizeSegment(data.intro),
        recap: normalizeSegment(data.recap),
        credits: normalizeSegment(data.credits),
        preview: normalizeSegment(data.preview),
        // We'll add timestamp when saving — not needed here
      };

      // Save to localStorage with timestamp
      const cacheEntry = {
        timestamp: Date.now(),
        data: normalized,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

      console.log("Skip segments fetched & cached:", normalized);
      setSkipSegments(normalized);
      setCurrentSkipSegment(null);

    } catch (error) {
      console.error("Error fetching skip segments:", error);
      setSkipSegments(null);
      setCurrentSkipSegment(null);
    }
  };

  // ── Main logic: check cache first ──
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;

      if (age < ONE_DAY_MS && parsed.data) {
        // Cache is still fresh → use it
        console.log("Using cached skip segments (age:", Math.round(age/60000), "min)");
        setSkipSegments(parsed.data);
        setCurrentSkipSegment(null);
        return; // ← important: skip fetch
      } else {
        // Stale → remove old entry
        console.log("Cache expired (age:", Math.round(age/86400000), "days) → refetching");
        localStorage.removeItem(cacheKey);
      }
    } catch (err) {
      console.warn("Invalid cache format → removing", err);
      localStorage.removeItem(cacheKey);
    }
  }

  // No valid cache → fetch from network
  fetchAndCacheSkipSegments();

}, [movieDetails.id, movieDetails.type, episode?.season, episode?.number, isVisible]);

  
  const formatForCleanId = (str) => {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  const getTypeLabel = (type) => {
    if (type === "Movie") {
      return "movie";
    } else if (type === "TV Series") {
      return "tv";
    } else {
      return type;
    }
  };
  
  useEffect(() => {
    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
    window.localStorage.setItem("id", query.get("id"));
  }, []);

  // FETCH TMDB DATA
  useEffect(() => {
    async function fetchData() {
      try {
      const IDdoFilme = query.get("id");
      const IDextraid = IDdoFilme?.split('-') || [];
      const IDextraido = IDextraid.pop();
      const originalType = IDdoFilme.split("/")[0];
      let movieDetails = await Utilities.getMovieDetails(IDextraido, originalType);
        if (movieDetails) {

          setMovieDetails(movieDetails);

          let episodes = movieDetails.episodes;
          let seasonDataObj = {};
          let fullSeasonDataObj = {};

          for (let index = 0; index < episodes.length; index++) {
              const episode = episodes[index];

              // Populate fullSeasonDataObj with all episodes
              if (episode.season in fullSeasonDataObj) {
                  fullSeasonDataObj[episode.season].push(episode);
              } else {
                  fullSeasonDataObj[episode.season] = [episode];
              }

              // Populate seasonDataObj with only released episodes
              if (episode.isReleased) {
                  if (episode.season in seasonDataObj) {
                      seasonDataObj[episode.season].push(episode);
                  } else {
                      seasonDataObj[episode.season] = [episode];
                  }
              }
          }

          setSeasonData(seasonDataObj);
          setFullSeasonData(fullSeasonDataObj);
    
          document.title = `${movieDetails.title} - Streamamos - Ver Filmes e Séries Online Grátis`;
    
          const checkLastPickedEpisode = async () => {
            const lastPickedEpisodeKey = `lastPickedEpisodeV1_${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`;
            const lastPickedEpisode = localStorage.getItem(lastPickedEpisodeKey);
          
            //FEATURE THAT ALLOWS TO SPECIFY THE EPISODE FROM THE URL
            // Get season and episode from URL parameters
            const urlSeason = parseInt(urlParams.get('s'));
            const urlEpisodeNum = parseInt(urlParams.get('e'));

            // Function to find episode by season and episode number
            const findEpisodeBySeasonAndNumber = (season, episodeNum) => {
              return movieDetails.episodes.find(ep => 
                ep.season === season && 
                ep.number === episodeNum && 
                ep.isReleased === true
              );
            };

            // Try to get episode from URL parameters first
            if (urlSeason && urlEpisodeNum && movieDetails.type === "TV Series") {
              const urlSpecifiedEpisode = findEpisodeBySeasonAndNumber(urlSeason, urlEpisodeNum);
              if (urlSpecifiedEpisode) {
                setEpisode(urlSpecifiedEpisode);
                localStorage.setItem(`lastPickedEpisodeV1_${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`, JSON.stringify(urlSpecifiedEpisode));
                if (user) {
                  const userData = fetchUserData();
                  const currentLastPicked = userData.userLastPickedEpisode || {};
                  setDoc(doc(db, "users", user.uid), {
                    userLastPickedEpisode: {
                      ...currentLastPicked,
                      [`${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`]: urlSpecifiedEpisode
                    }
                  }, { merge: true })
                    .then(() => {
                      console.log("Saved lastPickedEpisode to Firestore successfully!");
                      // Set Firestore changed flag since we modified the database
                      localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
                    })
                    .catch((error) => {
                      console.error("Error saving to Firestore:", error.message);
                    });
                }
                setShowPulseButton(true);
                return;
              }
            }

            // If URL parameters don't exist or specify an unreleased episode, 
            // continue with existing logic
            if (user) {
              console.log("User is logged in");
              try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                  const data = userDoc.data();
                  const userLastPickedEpisodes = data.userLastPickedEpisode || {};
                  const key = `${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`;
                  const savedEpisode = userLastPickedEpisodes[key];
                  
                  if (savedEpisode && movieDetails.type === "TV Series") {
                    setEpisode(savedEpisode);
                  } else {
                    setEpisode(movieDetails.episodes[0]);
                  }
                } else {
                  setEpisode(movieDetails.episodes[0]);
                }
              } catch (error) {
                console.error("Error fetching last picked episode from Firestore:", error.message);
                setEpisode(movieDetails.episodes[0]);
              }
            } else {
              // Handle non-logged-in users with localStorage
              if (lastPickedEpisode && movieDetails.type === "TV Series") {
                setEpisode(JSON.parse(lastPickedEpisode));
              } else {
                setEpisode(movieDetails.episodes[0]);
              }
            }
            setShowPulseButton(true);
          };

    
    

          const isAsianLanguage = (text) => {
            const specialCharactersRegex = /[\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0E00-\u0E7F\u0600-\u06FF\u0370-\u03FF\u0590-\u05FF\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F\u0A00-\u0A7F]/;
            return specialCharactersRegex.test(text);
          };
      
     // Search for Portuguese title in movies from the themoviedb API
     const res = await fetch(`${API_ENDPOINTS.TMDB_URL}${movieDetails.originalType}/${movieDetails.id}?api_key=${API_ENDPOINTS.TMDB_API}&language=pt-PT`);
     const data = await res.json();

     if (data && !data.success && movieDetails.type === "Movie") {

      if (movieDetails.images.logos && movieDetails.images.logos.length > 0) {
        const pngLogoImg = movieDetails.images.logos[0].file_path;
        setPngLogo(`${API_ENDPOINTS.TMDB_IMG_URL}w300${pngLogoImg}`);
      }

      const imgRes = await fetch(`${API_ENDPOINTS.TMDB_URL}movie/${movieDetails.id}/images?api_key=${API_ENDPOINTS.TMDB_API}`);
      const imgData = await imgRes.json();
      
        // Set the first backdrop image as the source
        if (imgData.backdrops && imgData.backdrops.length > 0) {
          const firstBackdropImage = imgData.backdrops[0].file_path;
          setBackdropImage(`${API_ENDPOINTS.TMDB_IMG_URL}w780${firstBackdropImage}`);
        }

        if (movieDetails.images.backdrops.length > 0) {
          const secondBackdropImage = movieDetails.images.backdrops[0].file_path;
          setBackdropImageVisible(`${API_ENDPOINTS.TMDB_IMG_URL}w1280${secondBackdropImage}`);
        } else if (imgData.backdrops && imgData.backdrops.length > 0) {
          const firstBackdropImage1 = imgData.backdrops[0].file_path;
          setBackdropImageVisible(`${API_ENDPOINTS.TMDB_IMG_URL}w1280${firstBackdropImage1}`);
        }

      if (isAsianLanguage(data.title)) {
        // If the title contains Asian characters, set it as movieDetails.title
        setPortugueseTitle(movieDetails.title);
      } else {
        // Otherwise, use the original title from data
        setPortugueseTitle(data.title);
      }

       setPoster(movieDetails.image);
       setPortugueseDesc(data.overview);
       const originalLanguage1 = languageList[data.original_language] || data.original_language;
       setOriginalLang(originalLanguage1);
       setIsSkeletonLoading(false);
    
       if (movieDetails.credits.cast && movieDetails.credits.cast.length > 0) {
        const cast = movieDetails.credits.cast.map((actor) => {    
          const formattedName = formatForCleanId(actor.name);
          const cleanId = `person/${formattedName}-${actor.id}`;
          return {
            name: actor.name,
            character: actor.character.replace("(voice)", "(voz)"),
            profilePath: actor.profile_path ? `${API_ENDPOINTS.TMDB_IMG_URL}w200${actor.profile_path}` : '/backupcast.png',
            actorId: cleanId,
          };
        });
        
        setCastInfo(cast);
      }
    
    
      const jobTranslations = {
        Director: 'Realizadora',
        Screenplay: 'Argumentista',
        Writer: 'Argumentista',
        Story: 'História',
        Idea: 'Ideia',
        Author: 'Autora',
        Characters: 'Personagens',
        'Comic Book': 'Banda Desenhada',
        Novel: 'Livro',
        Book: 'Livro',
        'Graphic Novel': 'Novela Gráfica',
        Producer: 'Produtora',
      };
    
      const jobTranslations2 = {
        Director: 'Realizador',
        Screenplay: 'Argumentista',
        Writer: 'Argumentista',
        Story: 'História',
        Idea: 'Ideia',
        Author: 'Autor',
        Characters: 'Personagens',
        'Comic Book': 'Banda Desenhada',
        Novel: 'Livro',
        Book: 'Livro',
        'Graphic Novel': 'Novela Gráfica',
        Producer: 'Produtor',
      };
    
    
      let crew = [];
      if (movieDetails.credits.crew && movieDetails.credits.crew.length > 0) {
        const filteredCrew = movieDetails.credits.crew.filter((person) =>
        person.job in jobTranslations
      );
    
      const sortedCrew = filteredCrew.sort((a, b) => {
        const jobPriority = {
             Director: 12,
             Screenplay: 11,
             Writer: 10,
             Story: 9,
             Idea: 8,
             Author: 7,
             Characters: 6,
             'Comic Book': 5,
             Novel: 4,
             Book: 3,
             'Graphic Novel': 2,
             Producer: 1,
           };
           if (a.job === b.job) {
             return b.popularity - a.popularity; // If two people have the same job, prioritize by popularity
           } else {
             return jobPriority[b.job] - jobPriority[a.job]; // Prioritize the jobs based on the defined priority
           }
      });
    
      let processedCrew = [];
      for (let i = 0; i < sortedCrew.length; i++) {
        if (processedCrew.length >= 3) {
          break;
        }
    
        const person = sortedCrew[i];
    
        // Determine the appropriate translation object based on gender
        const genderTranslations = person.gender === 1 ? jobTranslations : jobTranslations2;
    
        if (!processedCrew.some((p) => p.name === person.name)) {
          // Create an array to store all jobs associated with the crew member
          const jobs = [genderTranslations[person.job]];

          const formattedName = formatForCleanId(person.name);
          const cleanId = `person/${formattedName}-${person.id}`;
    
          processedCrew.push({
            name: person.name,
            jobs: jobs,
            profilePath: person.profile_path
              ? `${API_ENDPOINTS.TMDB_IMG_URL}w200${person.profile_path}`
              : '/backupcast.png',
            crewId: cleanId,
          });
        } else {
          // If crew member already exists, add the job to their jobs array
          const existingCrew = processedCrew.find((p) => p.name === person.name);
          existingCrew.jobs.push(genderTranslations[person.job]);
        }
      }
    
      crew = processedCrew;
    }
    
    const modifiedCrew = crew.map((producer) => ({
      ...producer,
      jobs: producer.jobs.join(' / ')
    }));
    
    setCrewInfo(modifiedCrew);
    
  
    
    
    
     if (movieDetails.videos.results && movieDetails.videos.results.length > 0) {
      const trailerfilme = movieDetails.videos.results.find(item => item.type === "Trailer");
      const teaserfilme = movieDetails.videos.results.filter(item => item.type === "Teaser");


      if (teaserfilme && teaserfilme.length > 0) {
        const lastTeaser = teaserfilme[teaserfilme.length - 1];
        const teaserLink = lastTeaser.key;
        setTrailerVideoId(teaserLink);
      } else {
        setTrailerVideoId(null);
      }


      if (trailerfilme) {
        const trailerLink = trailerfilme.key;
        setTrailer(`https://youtu.be/${trailerLink}`);
      } else {
        setTrailer(`https://www.youtube.com/results?search_query=${encodeURIComponent(movieDetails.title)}+${movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : ""}+Trailer`);
      }
    } else {
      setTrailer(null);
      setTrailerVideoId(null);
    }
    
    const digitalReleaseDate = movieDetails.release_dates.results.find(result => 
      result.release_dates.some(release => release.type === 4))
    ?.release_dates.find(release => release.type === 4)?.release_date;

    const phisycalReleaseDate = movieDetails.release_dates.results.find(result => 
      result.release_dates.some(release => release.type === 5))
    ?.release_dates.find(release => release.type === 5)?.release_date;
    
    // Search for the release_date with type 4 in "iso_3166_1": "US"
    const digitalDate = movieDetails.release_dates.results.find(
      (result) => result.iso_3166_1 === "US"
    )?.release_dates.find((release) => release.type === 4)?.release_date;
    
    const usTheatricalReleaseDate = movieDetails.release_dates.results.find(
      (result) => result.iso_3166_1 === "US"
    )?.release_dates.find((release) => release.type === 3)?.release_date;
    
    if (bypassMovieIds.includes(movieDetails.id) || !usTheatricalReleaseDate || (digitalDate && (new Date(digitalDate) < new Date())) || (new Date(usTheatricalReleaseDate) < new Date(Date.now() - 75 * 24 * 60 * 60 * 1000)) || (digitalReleaseDate && (new Date(digitalReleaseDate) < new Date())) || (phisycalReleaseDate && (new Date(phisycalReleaseDate) < new Date()))) {
      setReleaseDateUS(null);
    } else if (digitalDate) {
      const releaseDate = new Date(digitalDate);
      const formattedDate = releaseDate.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const parts = formattedDate.split('/');
      const invertedDate = `${parts[1]}-${parts[0]}-${parts[2]}`;
       // Calculate remaining days
       const currentDate = new Date();
       const timeDifference = releaseDate - currentDate;
       const remainingDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
       const remainingText = remainingDays === 1 ? `em ${remainingDays} dia` : 
                            `em ${remainingDays} dias`;
    
      setReleaseDateUS(
        <div className="digitalRelease">
        <div className="quality-header">
          <PiSealWarningFill size={50} />
          <span className="quality-pill">Qualidade: CAM</span>
        </div>
        <div className="quality-body">
          Versão HD prevista para: <span className="highlight">{invertedDate}</span> <span className="in-days">{` (${remainingText})`}</span>
        </div>
        <div class="quality-footer">
          {`*Para mais informações, clica no botão de aviso (⚠) no topo da página.`}
        </div>
        </div>
      );
    } else if (!digitalDate && usTheatricalReleaseDate) {
      setReleaseDateUS(
        <div className="digitalRelease">
        <div className="quality-header">
          <PiSealWarningFill size={50} />
          <span className="quality-pill">Qualidade: CAM</span>
        </div>
        <div className="quality-body">
          Versão HD prevista para: <span className="highlight">Ainda por Anunciar</span>
        </div>
        <div class="quality-footer">
          {`*Para mais informações, clica no botão de aviso (⚠) no topo da página.`}
        </div>
        </div>
      );
    }
    
    
    // Search for the certification in "iso_3166_1": "US"
    const usCertifications = movieDetails.release_dates.results.find(
      (result) => result.iso_3166_1 === "US"
    )?.release_dates;
    
    const certificationMapping = {
      NR: "N/A",
      G: "M/3 Anos",
      PG: "M/6 Anos",
      "PG-13": "M/12 Anos",
      R: "M/16 Anos",
      "NC-17": "M/18 Anos",
    };
    
    const validCertifications = ["NR", "G", "PG", "PG-13", "R", "NC-17"];
    let certificationUS = null;
    
    if (usCertifications) {
      const certification = usCertifications.find(
        (release) => validCertifications.includes(release.certification)
      );
      
      if (certification) {
        certificationUS = certificationMapping[certification.certification];
      }
    }
    
    setCertificationUS(certificationUS);
    
    
    
    
    
    
    
    
    if (movieDetails.belongs_to_collection) {
      setShowResults0(true);
      setShowResults(true);
      const collection = movieDetails.belongs_to_collection;
      const collectionID = collection.id;
    
      const rescollectiondata = await fetch(`${API_ENDPOINTS.TMDB_URL}collection/${collectionID}?api_key=${API_ENDPOINTS.TMDB_API}&language=en-US}`);
      const datacollectiondata = await rescollectiondata.json();
    
      const collectionTitle = datacollectiondata.name.replace(/(.*) Collection/, "$1");
    
      setCollectionTitle(collectionTitle);
      setBackdropImageCollection(`${API_ENDPOINTS.TMDB_IMG_URL}w780${datacollectiondata.backdrop_path}`);
    
      if (datacollectiondata.parts) {
        const movieParts = datacollectiondata.parts;
        const today = new Date(); // Get the current date
      
        const movieResults = movieParts
          .filter(movie => {
            const releaseDate = new Date(movie.release_date);
            return releaseDate <= today; // Filter only movies with release date equal or before today
          })
          .map(movie => {
            const formattedTitle = formatForCleanId(movie.title);
            const cleanId = `movie/${formattedTitle}-${movie.id}`;
            return {
              id: movie.id,
              cleanId: cleanId,
              type: "Movie", // Assuming the original field is 'type'
              title: movie.title,
              image: movie.poster_path, // Assuming the original field is 'image'
              releaseDate: movie.release_date, // Assuming the original field is 'releaseDate'
              media_type: movie.media_type,
              overview: movie.overview,
              vote_average: movie.vote_average,
            };
          });
      
        // Set the filtered and transformed movie results
        if (movieResults.length > 1) {
          setValue('1');
          setMovieResults(movieResults);
          setNumMoviesSaga(prevCount => prevCount + movieResults.length);
        }

      }
      
      
      
    }
    
    
    if (movieDetails.external_ids) {
      const idImdb = movieDetails.external_ids.imdb_id;
      setImdb(`https://www.imdb.com/title/${idImdb}/`);
    }
    
    
    if (movieDetails.rating) {
      const tmdbrating = movieDetails.rating;
      setTmdbRating(parseFloat(tmdbrating.toFixed(1)));
    }
    
    if (movieDetails.keywords && movieDetails.keywords.results && movieDetails.keywords.results.length > 0) {
      setKeywords(movieDetails.keywords.results.slice(0, 8));
    }
    
    
    
    
    
     }
    
    

    
    
    //Search for universe movies and tv series
  


    const universeData = await fetch('https://gist.githubusercontent.com/streamamos/cbcbb1114543c1c1f7a4410c8e62f1a2/raw');
    const universeCollection = await universeData.json();
    
    // Filter universes that contain the movie with matching ID
    const matchingUniverses = universeCollection.universe.filter((universe) => {
      const matchingMovies = universe.parts.filter((movie) => movie.id === movieDetails.id);
      return matchingMovies.length > 0;
    });
    
    if (matchingUniverses.length > 0) {
      setShowResults0(true);
      setShowResults2(true);
      setValue('2');
    
      // Select the second universe if it exists, otherwise fallback to the first
      const selectedUniverse = matchingUniverses.length > 1 ? matchingUniverses[1] : matchingUniverses[0];
      
      // Process the selected universe
      const collectionTitle = selectedUniverse.name;
      const backdropImageCollection = `${selectedUniverse.backdrop_path}`;
        setCollectionTitle2(collectionTitle);
        setBackdropImageCollection2(backdropImageCollection);
    
      const moviePromises = selectedUniverse.parts.map((movie) => {
          const { title, releaseDate, type, type2, image, id, media_type, overview, vote_average } = movie;
          const release_date = releaseDate.substring(0, 4);
    
          if (release_date <= new Date().getFullYear()) {
            const formattedTitle = formatForCleanId(title);
            const formattedType = getTypeLabel(type);
            const cleanId = `${formattedType}/${formattedTitle}-${id}`;
            return { id, cleanId, type, type2, title, image, releaseDate, media_type, overview, vote_average };
          } else {
            console.log(`Movie data not found for title: ${title} and release year: ${releaseDate}`);
            return null;
          }
      });
    
      const filteredMovies = moviePromises.filter((movie) => movie !== null);
      setMovieResults2(filteredMovies);
    
      // Separate movies based on type
      const moviesWithTypeMovie = filteredMovies.filter((movie) => movie.type === "Movie" && movie.type2 !== "Short");
      const moviesWithTypeTVSeries = filteredMovies.filter((movie) => movie.type === "TV Series" && movie.type2 !== "Short");
      const moviesWithTypeShorts = filteredMovies.filter((movie) => movie.type2 === "Short");
    
      // Set the counts in separate state variables
      setNumMovies(moviesWithTypeMovie.length);
      setNumShows(moviesWithTypeTVSeries.length);
      setNumShorts(moviesWithTypeShorts.length);
    }
    
    
  





    if (movieDetails.recommendations) {
      setShowResults0(true);
      setShowResults3(true);
    
    
      if (movieDetails.recommendations.results) {
        const movieParts = movieDetails.recommendations.results;
        const today = new Date(); // Get the current date
      
        const movieResults = movieParts
          .filter(movie => {
            const releaseDate = new Date(movie.release_date || movie.first_air_date);
            return releaseDate <= today; // Filter only movies with release date equal or before today
          })
          .map(movie => {
            const formattedTitle = formatForCleanId(movie.title || movie.name);
            const cleanId = `${movie.media_type}/${formattedTitle}-${movie.id}`;
            return {
              id: movie.id,
              cleanId: cleanId,
              ...(movie.media_type === 'movie' ? { type: 'Movie' } : { type: 'TV Series' }),
              title: movie.title || movie.name,
              image: movie.poster_path, // Assuming the original field is 'image'
              releaseDate: movie.release_date || movie.first_air_date, // Assuming the original field is 'releaseDate'
              media_type: movie.media_type,
              overview: movie.overview,
              vote_average: movie.vote_average
            };
          }).slice(0, 16);
      
        // Set the filtered and transformed movie results
        setMovieResults3(movieResults);

        const moviesWithTypeMovie = movieResults.filter((movie) => movie.type === "Movie");
        const moviesWithTypeTVSeries = movieResults.filter((movie) => movie.type === "TV Series");
        
        // Update the movie count based on the filtered results
        setNumMovies3(moviesWithTypeMovie.length);
        setNumShows3(moviesWithTypeTVSeries.length);
      }
      
      
      
    }

    
    
    
    
    
    
    
    
    
    // Search for Portuguese title in tvshows from the themoviedb API

    
    if (data && !data.success && movieDetails.type === "TV Series") {

      if (movieDetails.images.logos && movieDetails.images.logos.length > 0) {
        const pngLogoImg = movieDetails.images.logos[0].file_path;
        setPngLogo(`${API_ENDPOINTS.TMDB_IMG_URL}w300${pngLogoImg}`);
      }

      const imgRes1 = await fetch(`${API_ENDPOINTS.TMDB_URL}tv/${movieDetails.id}/images?api_key=${API_ENDPOINTS.TMDB_API}`);
      const imgData1 = await imgRes1.json();
  
  
      // Set the first backdrop image as the source
      if (imgData1.backdrops && imgData1.backdrops.length > 0) {
        const firstBackdropImage1 = imgData1.backdrops[0].file_path;
        setBackdropImage(`${API_ENDPOINTS.TMDB_IMG_URL}w780${firstBackdropImage1}`);
      }

      if (movieDetails.images.backdrops.length > 0) {
        const secondBackdropImage = movieDetails.images.backdrops[0].file_path;
        setBackdropImageVisible(`${API_ENDPOINTS.TMDB_IMG_URL}w1280${secondBackdropImage}`);
      } else if (imgData1.backdrops && imgData1.backdrops.length > 0) {
        const firstBackdropImage1 = imgData1.backdrops[0].file_path;
        setBackdropImageVisible(`${API_ENDPOINTS.TMDB_IMG_URL}w1280${firstBackdropImage1}`);
      }

      if (isAsianLanguage(data.name)) {
        // If the title contains Asian characters, set it as movieDetails.title
        setPortugueseTitle(movieDetails.title);
      } else {
        // Otherwise, use the original title from data
        setPortugueseTitle(data.name);
      }

      setPoster(movieDetails.image);
      setPortugueseDesc(data.overview);

      const statusTranslations = {
        Ended: 'Concluída',
        'Returning Series': 'Em Andamento',
        'In Production': 'Em Produção',
        Canceled: 'Cancelada',
        Pilot: 'Piloto',
      };

      const originalLanguage1 = languageList[movieDetails.original_language] || movieDetails.original_language;
      setOriginalLang(originalLanguage1);
      setIsSkeletonLoading(false);

      setNetwork(movieDetails.networks[0]?.name);
      setImdb(`https://www.imdb.com/title/${movieDetails.external_ids.imdb_id}/`);
      setTmdbRating(parseFloat(movieDetails.rating.toFixed(1)));
      const translatedStatus = statusTranslations[movieDetails.status] || movieDetails.status;
      setStatus(translatedStatus);

    if (movieDetails.credits.cast && movieDetails.credits.cast.length > 0) {
      const cast1 = movieDetails.credits.cast.map((actor) => {    
        const formattedName = formatForCleanId(actor.name);
        const cleanId = `person/${formattedName}-${actor.id}`;
        return {
          name: actor.name,
          character: actor.character.replace("(voice)", "(voz)"),
          profilePath: actor.profile_path ? `${API_ENDPOINTS.TMDB_IMG_URL}w200${actor.profile_path}` : '/backupcast.png',
          actorId: cleanId,
        };
      });
      
      setCastInfo(cast1);
    }
    
    
    
    
    

      






    
    // Fetch creators of the series
    if (movieDetails.created_by && movieDetails.created_by.length > 0) {
      const creators = movieDetails.created_by.slice(0, 3).map((creator) => {
        const formattedName = formatForCleanId(creator.name);
        const cleanId = `person/${formattedName}-${creator.id}`;

        return {
        name: creator.name,
        jobs: creator.gender === 1 ? 'Criadora' : 'Criador',
        profilePath: creator.profile_path ? `${API_ENDPOINTS.TMDB_IMG_URL}w200${creator.profile_path}` : '/backupcast.png',
        crewId: cleanId,
      }});
      setCrewInfo(creators);
    }
    
    
    
     if (movieDetails.videos.results && movieDetails.videos.results.length > 0) {
      const trailerserie = movieDetails.videos.results.find(item => item.type === "Trailer");
      const teaserserie = movieDetails.videos.results.find(item => item.type === "Teaser");
      if (teaserserie) {
        setTrailerVideoId(teaserserie.key);
      } else {
        setTrailerVideoId(null);
      }

      if (trailerserie) {
        const trailerLink1 = trailerserie.key;
        setTrailer(`https://youtu.be/${trailerLink1}`);
      } else {
        setTrailer(`https://www.youtube.com/results?search_query=${encodeURIComponent(movieDetails.title)}+${movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : ""}+Trailer`);
      }
     } else {
      setTrailer(null);
      setTrailerVideoId(null);
     }

     if (movieDetails.keywords && movieDetails.keywords.results && movieDetails.keywords.results.length > 0) {
      setKeywords(movieDetails.keywords.results.slice(0, 8));
    }
    
    
    
    }
    
    // const auth = getAuth();
    // const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    //   checkLastPickedEpisode(currentUser);
    // });
  
    // return () => unsubscribe(); // Clean up the listener
    checkLastPickedEpisode();
        } else {
          console.error("Movie details not available.");
        }


} catch (error) {
  // Handle the error gracefully
  console.error("Error fetching movie details:", error);
}
    }
    
    fetchData();
  }, [query]);



useEffect(() => {
  if (movieDetails.id > 0) {
    setIsLoading(false);
  } else {
    setIsLoading(true);
  }
}, [movieDetails.id]);

// useEffect(() => {
//   if (!isLoading) {
//     const timer = setTimeout(() => {
//       setShowPulseButton(true);
//     }, 1500);
  
//     return () => clearTimeout(timer);
//   }
// }, [isLoading]);


useEffect(() => {
  const checkOverflow = () => {
    if (movieCardListRef.current) {
      const hasOverflow = movieCardListRef.current.scrollWidth > movieCardListRef.current.clientWidth;
      setIsOverflowing(hasOverflow);
    }
  };

  setTimeout(checkOverflow, 200);
  window.addEventListener('resize', checkOverflow);
  
  return () => {
    try {
      window.removeEventListener('resize', checkOverflow);
    } catch (e) {
      console.warn('Error removing overflow resize listener:', e);
    }
  };
}, [value, numMovies, numMoviesSaga, numMovies3, numShows, numShows3]);

const scrollLeft = () => {
  if (movieCardListRef.current) {
    movieCardListRef.current.scrollLeft -= 200;
  }
};

const scrollRight = () => {
  if (movieCardListRef.current) {
    movieCardListRef.current.scrollLeft += 200;
  }
};



  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotLoading(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    let timeoutId;
    if (showDivLoader) {
      timeoutId = setTimeout(() => {
        setShowDivLoader(false);
      }, 4000);
    }
    
    return () => clearTimeout(timeoutId);
  }, [showDivLoader, isLoading]);

  
  useEffect(() => {
    if (isLoading === false) {
      setShowDivLoader(true);
      }
  }, [isLoading]);


  // Add this function with your other handler functions
const handleDownloadClick = () => {
  setOpenDownloadModal(true);
  setDownloadModeChoice(null);
  setDownloadData(null);
};

const handleDownloadModeSelect = (mode) => {
  setDownloadModeChoice(mode);
  setDownloadData(null);
  setIsDownloadLoading(true);
  const season = movieDetails.type === "TV Series" ? episode.season : '0';
  const episodeNum = movieDetails.type === "TV Series" ? episode.number : '0';
  const year = movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : "";
  const keyword = encodeURIComponent(movieDetails.title);
  const baseParams = `keyword=${keyword}&tmdbid=${movieDetails.id}&year=${year}&season=${season}&episode=${episodeNum}&server=default`;
  const downloadUrl = mode === 'torrent'
    ? `${API_ENDPOINTS.STREAMAMOS_PROVIDERS}downloads/torrentio?${baseParams}`
    : `${API_ENDPOINTS.STREAMAMOS_PROVIDERS}downloads/dahmer?${baseParams}`;
  fetch(downloadUrl)
    .then(response => response.json())
    .then(data => {
      setDownloadData(data);
      setIsDownloadLoading(false);
    })
    .catch(error => {
      console.error("Error fetching download data:", error);
      setIsDownloadLoading(false);
    });
};

const handleCloseDownloadModal = () => {
  setOpenDownloadModal(false);
  setDownloadModeChoice(null);
  setDownloadData(null);
};

const handleDownloadModalBack = () => {
  setDownloadModeChoice(null);
  setDownloadData(null);
};

const handleCloseCastModal = () => {
  setIsCastModalOpen(false);
};


// Add this function with your other handler functions
const handleSort = (property) => {
  const isAsc = sortBy === property && sortDirection === 'asc';
  setSortDirection(isAsc ? 'desc' : 'asc');
  setSortBy(property);
};

// Add this function to sort the torrents
const getSortedTorrents = () => {
  if (!downloadData || !downloadData.sources || !downloadData.sources.torrents) {
    return [];
  }
  
  return [...downloadData.sources.torrents].sort((a, b) => {
    let aValue, bValue;
    
    if (sortBy === 'quality') {
      // For descending order, maintain the original order
      if (sortDirection === 'desc') {
        return downloadData.sources.torrents.indexOf(a) - downloadData.sources.torrents.indexOf(b);
      } else {
        return downloadData.sources.torrents.indexOf(b) - downloadData.sources.torrents.indexOf(a);
      }
    }
    
    if (sortBy === 'size') {
      // Extract numeric value from size string (e.g., "63 GB" -> 63)
      aValue = parseFloat(a.size) || 0;
      bValue = parseFloat(b.size) || 0;
      
      // Handle different units (GB, MB, etc.)
      if (a.size.includes('GB') && b.size.includes('MB')) {
        bValue = bValue / 1024;
      } else if (a.size.includes('MB') && b.size.includes('GB')) {
        aValue = aValue / 1024;
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (sortBy === 'seeds') {
      aValue = parseInt(a.seeds) || 0;
      bValue = parseInt(b.seeds) || 0;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });
};

const handleDirectSort = (property) => {
  const isAsc = directSortBy === property && directSortDirection === 'asc';
  setDirectSortDirection(isAsc ? 'desc' : 'asc');
  setDirectSortBy(property);
};

const getSortedDirectDownloads = () => {
  if (!downloadData || !downloadData.sources || !downloadData.sources.downloads) {
    return [];
  }
  return [...downloadData.sources.downloads].sort((a, b) => {
    if (directSortBy === 'quality') {
      // For descending order, maintain the original order
      if (directSortDirection === 'desc') {
        return downloadData.sources.downloads.indexOf(a) - downloadData.sources.downloads.indexOf(b);
      } else {
        return downloadData.sources.downloads.indexOf(b) - downloadData.sources.downloads.indexOf(a);
      }
    }
    if (directSortBy === 'size') {
      let aVal = parseFloat((a.size || '0').replace(/[^\d.]/g, '')) || 0;
      let bVal = parseFloat((b.size || '0').replace(/[^\d.]/g, '')) || 0;
      if ((a.size || '').toLowerCase().includes('gb') && (b.size || '').toLowerCase().includes('mb')) {
        bVal = bVal / 1024;
      } else if ((a.size || '').toLowerCase().includes('mb') && (b.size || '').toLowerCase().includes('gb')) {
        aVal = aVal / 1024;
      }
      return directSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });
};
  

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setOneMoment(true);
    }, 5000);
  
    const timer2 = setTimeout(() => {
      setOneMoment(false);
    }, 15000);
  
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);



  useEffect(() => {
    const now = new Date();
    const dateTime = `${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  
    // Find the object in enabledServers where serverNumber matches selectedServer
    const serverObject = filteredEnabledServers.find(server => server.serverNumber === selectedServer);
  
    // Check if the serverObject exists and if its serverName is "embed"
    if (serverObject && serverObject.serverName === "embed") {
      const dataToSave = {
        title: movieDetails.title,
        releaseDate: movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : "N/A",
        releaseDateFull: movieDetails.releaseDate,
        type: movieDetails.type,
        originalType: movieDetails.originalType,
        id: movieDetails.id,
        image: movieDetails.image.replace(`${API_ENDPOINTS.TMDB_IMG_URL}w185`, ""),
        savedTime: 0,  // Reset savedTime
        lastVisit: dateTime,
        duration: 0,  // Reset duration
        selectedServer: selectedServer,
        overview: movieDetails.description,
        vote_average: movieDetails.rating,
        genres: movieDetails.genres_ids,
        media_type: movieDetails.originalType,
        episode: episode || {},
        recommendations: movieDetails.recommendations,
      };
      localStorage.setItem(`savedHistoryDataV1_${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`, JSON.stringify(dataToSave));

      if (user && !isVisible) {
        const userData = fetchUserData();
        const currentHistory = userData.userHistory || {};
        setDoc(doc(db, "users", user.uid), {
          userHistory: {
            ...currentHistory,
            [`${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`]: dataToSave
          }
        }, { merge: true })
          .then(() => {
            console.log("Saved to Firestore successfully!");
            // Set Firestore changed flag since we modified the database
            localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
          })
          .catch((error) => {
            console.error("Error saving to Firestore:", error.message);
          });
      }
    }
  
  }, [selectedServer, isVisible]);
  
  

  let lastSavedTime = Date.now();
  let isSaving = false;
  let lastSavedTimePosition = 0;
  

  
  useEffect(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
      eventListenersRef.current = [];
    }
    
    isSaving = false;
    lastSavedTimePosition = 0;
    initialTimeSetRef.current = false;  // Reset the flag when episode/server changes
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [selectedServer, episode]);

  const fetchInitialTime = async (title, releaseDate) => {
    const savedDataKey = `savedHistoryDataV1_${title.replace(/[.~*\/\[\]]/g, '')}_${releaseDate}`;
    let initialTime = 0;

    if (user && !userDataFetchedRef.current) {
      try {
        console.log("Fetching time from Firestore for:", title, releaseDate);

          const userData = await fetchUserData();
          if (userData && userData.userHistory) {
            const userHistory = userData.userHistory;
            const key = `${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`;
            const data = userHistory[key]; // Get the saved episode from the object
            const userHistoryData = data;
            
            if (userHistoryData && typeof userHistoryData.savedTime === 'number') {
              initialTime = userHistoryData.savedTime;
              console.log("Retrieved savedTime from Firestore:", initialTime);
            }
            
            if (userHistoryData && movieDetails.type === "TV Series" && episode.id !== userHistoryData.episode.id) {
              console.log("New episode detected, resetting time to 0");
              initialTime = 0;
            }
          } else {
            initialTime = 0;
          }

          // Mark that we've fetched user data once
          userDataFetchedRef.current = true;

      } catch (error) {
        console.error("Error fetching user history from Firestore:", error);
        // Fallback to localStorage if Firestore fails
        const localSavedData = localStorage.getItem(savedDataKey);
        if (localSavedData) {
          const parsedData = JSON.parse(localSavedData);
          initialTime = parsedData.savedTime;
          if (parsedData && movieDetails.type === "TV Series" && episode.id !== parsedData.episode.id) {
            console.log("New episode detected, resetting time to 0");
            initialTime = 0;
          }
          console.log("Fallback to localStorage:", initialTime);
        }
        // Mark that we've attempted to fetch user data
        userDataFetchedRef.current = true;
      }
    } else {
      // Use localStorage for subsequent calls or when user is not logged in
      const localSavedData = localStorage.getItem(savedDataKey);
      if (localSavedData) {
        const parsedData = JSON.parse(localSavedData);
        initialTime = parsedData.savedTime;
        if (parsedData && movieDetails.type === "TV Series" && episode.id !== parsedData.episode.id) {
          console.log("New episode detected, resetting time to 0");
          initialTime = 0;
        }
        console.log("Using localStorage:", initialTime);
      }
    }

    return initialTime;
  };
  

// Helper function to check and set current skip segment
const checkSkipSegment = (currentTime) => {
  if (!skipSegments || movieDetails.type !== "TV Series") {
    setCurrentSkipSegment(null);
    return;
  }

  // Throttle: only check every 3 seconds (use Math.abs to handle seeking backwards)
  const timeSinceLastCheck = Math.abs(currentTime - lastSkipCheckTimeRef.current);
  if (timeSinceLastCheck < 3) {
    return;
  }

  lastSkipCheckTimeRef.current = currentTime;

  const currentTimeMs = currentTime * 1000; // Convert to milliseconds
  let foundSegment = null;

  // Check intro
  if (skipSegments.intro?.end_ms != null) {
    const startMs = skipSegments.intro.start_ms ?? 0; // Default to 0 if null
    if (currentTimeMs >= startMs && currentTimeMs <= skipSegments.intro.end_ms) {
    foundSegment = { type: 'intro', end: (skipSegments.intro.end_ms + 500) / 1000 };
    }
  }
  // Check recap
  if (skipSegments.recap?.end_ms != null) {
    const startMs = skipSegments.recap.start_ms ?? 0; // Default to 0 if null
    if (currentTimeMs >= startMs && currentTimeMs <= skipSegments.recap.end_ms) {
    foundSegment = { type: 'recap', end: (skipSegments.recap.end_ms + 500) / 1000 };
    }
  }

  console.log('🎬✨ Found Segment:', foundSegment);

  setCurrentSkipSegment(foundSegment);
};



  const handleTimeUpdateNetplayer = (player) => {

  const video = videoRef.current;
  if (video && !videoElementRef.current) {
    videoElementRef.current = video?.player?.tech?.el() || video;
  }


    playerRefs.current = player;
    const { id, type, title, image, releaseDate, originalType } = movieDetails;
    let savedData = JSON.parse(localStorage.getItem(`savedHistoryDataV1_${title.replace(/[.~*\/\[\]]/g, '')}_${releaseDate}`));
    
    const now = new Date();
    const dateTime = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    
    let videoStarted = false;
    
    const serverIndex = filteredEnabledServers.findIndex(
      (server) => server.serverNumber === selectedServer
    );
    const server = filteredEnabledServers[serverIndex];
    const { serverNumber } = server;
    
    const videoStartTimeout = setTimeout(() => {
      if (!videoStarted) {
        console.log("Video did not start within 15 seconds, switching server...");
        setServerStates((prev) => ({ ...prev, [serverNumber]: 'notWorking' }));
        scheduleAutoServerSwitch();
      }
    }, 15000);

    const cleanup = () => {
      try {
        eventListenersRef.current.forEach(({ event, handler }) => {
          if (playerRefs.current) {
            try {
              playerRefs.current.removeEventListener(event, handler);
            } catch (e) {
              // Swallow errors from listeners on torn-down player refs
              console.warn('Error removing video event listener:', e);
            }
          }
        });
      } catch (e) {
        console.warn('Error during video cleanup:', e);
      } finally {
        eventListenersRef.current = [];
        clearTimeout(videoStartTimeout);
      }
    };

    cleanupRef.current = cleanup;

    const handleLoadedMetadata = async () => {
      // Only set initial time if it hasn't been set yet for this episode/server
      if (!initialTimeSetRef.current) {
        const initialTime = await fetchInitialTime(title, releaseDate);
        console.log("Initial time before checks:", initialTime);
        
        let finalTime = initialTime;

        console.log("Setting player time to:", finalTime);
        player.currentTime = finalTime;
        initialTimeSetRef.current = true;
      }
    };

    const handleTimeUpdate = () => {
      if (!videoStarted) {
        console.log("Video is playing!");
        videoStarted = true;
        clearTimeout(videoStartTimeout);

        heartbeatRef.current = setInterval(() => {
          posthog.capture('video_watching_heartbeat', {
            title: movieDetails.title,
            type: movieDetails.type,
            id: movieDetails.id,
          });
        }, 5 * 60 * 1000); // every 5 minutes

      }

      if (player.currentTime > 0 && player.duration > 31) {
        const savedTime = player.currentTime >= 5 ? player.currentTime - 5 : player.currentTime;
        const dataToSave = {
          title,
          releaseDate: releaseDate.substring(0, 4),
          releaseDateFull: releaseDate,
          type,
          originalType,
          id,
          image: image.replace(`${API_ENDPOINTS.TMDB_IMG_URL}w185`, ""),
          savedTime: savedTime,
          lastVisit: dateTime,
          duration: player.duration,
          selectedServer: selectedServer,
          overview: movieDetails.description,
          vote_average: movieDetails.rating,
          genres: movieDetails.genres_ids,
          media_type: movieDetails.originalType,
          episode: episode || {},
          recommendations: movieDetails.recommendations,
        };

        localStorage.setItem(`savedHistoryDataV1_${title.replace(/[.~*\/\[\]]/g, '')}_${releaseDate}`, JSON.stringify(dataToSave));

        if (!isSaving && (player.currentTime - lastSavedTimePosition >= 120 || 
            // player.currentTime < lastSavedTimePosition || 
            (player.currentTime >= 3 && player.currentTime < 3.2))) {
          
          lastSavedTimePosition = player.currentTime;
          
          if (user) {
            const userData = fetchUserData();
            isSaving = true;
            const currentHistory = userData.userHistory || {};
            setDoc(doc(db, "users", user.uid), {
              userHistory: {
                ...currentHistory,
                [`${title.replace(/[.~*\/\[\]]/g, '')}_${releaseDate}`]: dataToSave
              }
            }, { merge: true })
              .then(() => {
                console.log("Current time saved to Firestore successfully!");
                // Set Firestore changed flag since we modified the database
                localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
              })
              .catch((error) => {
                console.error("Error saving to Firestore:", error.message);
              })
              .finally(() => {
                isSaving = false;
              });
          }
        }

        // Check for skip segments (intro/recap)
        if (player.currentTime > 2) {
          checkSkipSegment(player.currentTime);
        }

        // Rest of the handleTimeUpdate function remains the same...
        if (movieDetails.type === "TV Series") {
          const currentSeason = episode.season;
          const currentEpisodeNumber = episode.number;
          const episodes = seasonData[currentSeason];
          const currentIndex = episodes.findIndex((ep) => ep.number === currentEpisodeNumber);
          const nextSeasons = Object.keys(seasonData)
            .map(Number)
            .sort((a, b) => a - b)
            .filter((season) => season > currentSeason);

          // Determine the threshold time
          const hasCredits = skipSegments?.credits?.start_ms != null;
          const creditsStartTime = hasCredits ? (skipSegments.credits.start_ms - 2000) / 1000 : null;

        const creditsBeforeDuration = hasCredits && (skipSegments.credits.start_ms / 1000) < player.duration;
        const threshold = creditsBeforeDuration ? creditsStartTime : (0.92 * player.duration);

          setIsNextEpisodeOverlay(
            player.currentTime >= threshold && 
            (currentIndex < episodes.length - 1 || nextSeasons.length > 0)
          );
        } else if (movieDetails.type === "Movie") {
          // Try to find current movie index in movieResults2
          // const filteredMovies = movieResults2.filter(movie => 
          //   movie.type === "Movie" && movie.type2 !== "Short"
          // );
          // const currentIndex2 = filteredMovies.findIndex(movie => movie.id === movieDetails.id);
          // const hasNextMovieInCollection2 = currentIndex2 !== -1 && currentIndex2 < filteredMovies.length - 1;

          // If not found in movieResults2, try movieResults
          const currentIndex = movieResults.findIndex(movie => movie.id === movieDetails.id);
          const hasNextMovieInCollection = currentIndex !== -1 && currentIndex < movieResults.length - 1;

          setIsNextEpisodeOverlay(
            player.currentTime >= 0.93 * player.duration && 
            (hasNextMovieInCollection)
          );
        }

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            artwork: [{
              src: backdropImage || "/backupback.jpg",
              sizes: "320x180",
              type: "image/jpeg"
            }]
          });
        }
      }
    };

    // Add event listeners and store them
    player.addEventListener('loadedmetadata', handleLoadedMetadata);
    player.addEventListener('timeupdate', handleTimeUpdate);
    eventListenersRef.current.push(
      { event: 'loadedmetadata', handler: handleLoadedMetadata },
      { event: 'timeupdate', handler: handleTimeUpdate }
    );
  };


  useEffect(() => {
    return () => {
      const video = videoElementRef.current;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        console.log("HLS destroyed");
      }
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        if (navigator.mediaSession) {
          navigator.mediaSession.metadata = null;
          navigator.mediaSession.playbackState = "none";
        }
        console.log("MP4 destroyed");
        videoElementRef.current = null; // Clear after cleanup
      }
      stopHeartbeat();
    };
  }, [currentPath, selectedServer, episode, sourceUnavailable]);



  // Save the selected subtitle label to localStorage
  const handleSubtitleChange = (label) => {
    localStorage.setItem("selectedSubtitle_Vidstack", label);
  };

  // Retrieve the saved subtitle label and set the default index
  useEffect(() => {
    if (isIOS) {
      if (!playerRef.current) return;
  
      const textTracks = playerRef.current.textTracks;
  
      // Guard: ensure at least one track exists
      if (!textTracks || textTracks.length === 0) return;
  
      const savedSubtitleLabel = localStorage.getItem("selectedSubtitle_Vidstack");
  
      if (savedSubtitleLabel) {
        const track = subtitlesArray.find((track) => track.lang === savedSubtitleLabel);
        if (track) {
          const selectedTrack = Array.from(textTracks).find((t) => t.label === savedSubtitleLabel);
          if (selectedTrack) {
            selectedTrack.mode = "showing";
          }
        } else {
          // Guard added here
          if (textTracks[0]) textTracks[0].mode = "showing";
        }
      } else {
        // Guard added here
        if (textTracks[0]) textTracks[0].mode = "showing";
      }
    }
  }, [subtitlesArray, isIOS]);

  // Listen for subtitle changes using Vidstack's API
  useEffect(() => {
    if (isIOS) {
      if (!playerRef.current) return;

      const player = playerRef.current;
  
      const handleTrackChange = (event) => {
        const selectedTrack = event.detail; // Get the selected track
        if (selectedTrack) {
          handleSubtitleChange(selectedTrack.label); // Save the selected subtitle label
        }
      };
  
      player.addEventListener("text-track-change", handleTrackChange);
  
      return () => {
        try {
          if (player) {
            player.removeEventListener("text-track-change", handleTrackChange);
          }
        } catch (e) {
          // Swallow errors from player teardown (null internal refs, etc.)
          console.warn('Error removing subtitle track listener:', e);
        }
      };
    }

  }, [subtitlesArray, isIOS]);


  
  const handleVidstackPlayerInit = async (event) => {
    const player = event.target;
    const { title, releaseDate, type } = movieDetails;
    // let savedData = JSON.parse(localStorage.getItem(`savedHistoryDataV1_${title.replace(/[.~*\/\[\]]/g, '')}_${releaseDate}`));
  
    // if (savedData) {
    //   // Check for new episode
    //   if (type === "TV Series" && episode.id !== savedData.episode.id) {
    //     savedData.savedTime = 0; // Reset for new episode
    //     localStorage.setItem(`savedHistoryDataV1_${title.replace(/[.~*\/\[\]]/g, '')}_${releaseDate}`, JSON.stringify(savedData));
    //   }
  
    //   // Set the player to the saved time
    //   player.currentTime = savedData.savedTime || 0;
    // }

          // Only set initial time if it hasn't been set yet for this episode/server
          if (!initialTimeSetRef.current) {
            const initialTime = await fetchInitialTime(title, releaseDate);
            console.log("Initial time before checks:", initialTime);
            
            let finalTime = initialTime;
    
            console.log("Setting player time to:", finalTime);
            player.currentTime = finalTime;
            initialTimeSetRef.current = true;
          }
  };


  const handleTimeUpdateVidstack = (event) => {
    const player = playerRef.current;
    
    if (!player || !player.currentTime || !player.duration) {
      // If player or required properties are not yet available, exit early
      return;
    }
  
    const { title, releaseDate, image, originalType, type, id, description, rating, genres_ids } = movieDetails;
  
    if (player.currentTime > 0 && player.duration > 31) {
      const now = new Date();
      const dateTime = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      const savedTime = player.currentTime >= 5 ? player.currentTime - 5 : player.currentTime;
  
      const dataToSave = {
        title,
        releaseDate: releaseDate.substring(0, 4),
        releaseDateFull: releaseDate,
        type,
        originalType,
        id,
        image: image.replace(`${API_ENDPOINTS.TMDB_IMG_URL}w185`, ""),
        savedTime,
        lastVisit: dateTime,
        duration: player.duration,
        selectedServer,
        overview: description,
        vote_average: rating,
        genres: genres_ids,
        media_type: originalType,
        episode: episode || {},
        recommendations: movieDetails.recommendations,
      };
  
      localStorage.setItem(`savedHistoryDataV1_${title.replace(/[.~*\/\[\]]/g, '')}_${releaseDate}`, JSON.stringify(dataToSave));
      if (!isSaving && (player.currentTime - lastSavedTimePosition >= 120 
        // || player.currentTime < lastSavedTimePosition 
        || (player.currentTime >= 3 && player.currentTime < 3.2))) {  // 2 minutes (120,000 ms)
        lastSavedTimePosition = player.currentTime;
        isSaving = true;  // Set flag to true to prevent duplicate saves

        if (user) {
          const userData = fetchUserData();
          isSaving = true;
          const currentHistory = userData.userHistory || {};
          setDoc(doc(db, "users", user.uid), {
            userHistory: {
              ...currentHistory,
              [`${title.replace(/[.~*\/\[\]]/g, '')}_${releaseDate}`]: dataToSave
            }
          }, { merge: true })
            .then(() => {
              console.log("Current time saved to Firestore successfully!");
              // Set Firestore changed flag since we modified the database
              localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
            })
            .catch((error) => {
              console.error("Error saving to Firestore:", error.message);
            })
            .finally(() => {
              isSaving = false;
            });
        }
      }
  
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          artwork: [
            {
              src: backdropImage || "/backupback.jpg",
              sizes: "320x180",
              type: "image/jpeg",
            },
          ],
        });
      }
    }
  };

// Configuration object to store all important variables
const hlsConfig = {
  // Bandwidth thresholds
  goodBandwidthThreshold: 2000, // kbps - minimum bandwidth considered "good"
  bandwidthSafetyFactor: 1,   // multiplier for determining if bandwidth can support a level
  
  // Counter thresholds
  consecutiveGoodMeasurements: 3, // number of good measurements before attempting quality increase
  stuckQualityThreshold: 5,       // number of measurements stuck at low quality before force reset
  stuck720Threshold: 20,          // number of measurements stuck at 720p before force reset
  lowQualityThreshold: 360,       // height in pixels below which quality is considered "low"
  
  // Timing
  qualityCheckInterval: 5000,     // milliseconds between periodic quality checks
};

const handleHlsInit = (hls) => {
  hlsRef.current = hls;
  let goodBandwidthCounter = 0;
  let stuckQualityCounter = 0;
  let totalFragments = null; // To store the total number of fragments
  const selectedServerEmbed = filteredEnabledServers.find(server => server.serverNumber === selectedServer);

  // Function to determine optimal level based on bandwidth
  const findOptimalLevel = () => {
    const bandwidthKbps = Math.round(hls.bandwidthEstimate / 1000);
    // Find highest level that our bandwidth can support with a safety margin
    for (let i = hls.levels.length - 1; i >= 0; i--) {
      const levelBitrateKbps = Math.round(hls.levels[i].bitrate / 1000);
      // Use configurable safety factor
      if (bandwidthKbps >= levelBitrateKbps * hlsConfig.bandwidthSafetyFactor) {
        return i;
      }
    }
    return 0; // Fallback to lowest level
  };

  const getTotalFragments = () => {
    if (!hls || !hls.levels || hls.currentLevel === -1) return null;
    
    const currentLevelDetails = hls.levels[hls.currentLevel]?.details;
    const totalFragments = currentLevelDetails?.fragments?.length || null;
    return totalFragments;
  };

  // Update total fragments when the playlist is loaded
  // hls.on(Hls.Events.LEVEL_UPDATED, (event, data) => {
  //   if (data.details && data.details.fragments) {
  //     totalFragments = data.details.fragments.length; // Store total fragments
  //   }
  // });

  hls.on(Hls.Events.FRAG_LOADED, function(event, data) {
    const bandwidthKbps = Math.round(hls.bandwidthEstimate / 1000);
    // Get the level of the fragment that was just loaded
    const fragLevel = data.frag.level;
    const fragHeight = hls.levels[fragLevel]?.height || 0;
    const fragBitrate = Math.round(hls.levels[fragLevel]?.bitrate / 1000);

    // Get the fragment's start time and format it
    const fragStartTime = data.frag.start;
    const formattedStartTime = new Date(fragStartTime * 1000).toISOString().substr(14, 5); // Format as MM:SS
    const fragSequenceNumber = data.frag.sn; // Fragment sequence number

    const formatter = new Intl.NumberFormat('en-US');
    const formattedCounter = formatter.format(bandwidthKbps);

    if (selectedServerEmbed.serverName === "vidcloud" || selectedServerEmbed.serverName === "megacloud" || selectedServerEmbed.providerName === "123anime" || selectedServerEmbed.serverName === "luluvdo") {
      totalFragments = getTotalFragments(); // Get total fragments
      console.log(`-----> Counting fragments on vidcloud/megacloud: ${fragSequenceNumber}/${totalFragments}`);
    }

    if (totalFragments && fragSequenceNumber === totalFragments - 1 && (selectedServerEmbed.serverName === "vidcloud" || selectedServerEmbed.serverName === "megacloud" || selectedServerEmbed.providerName === "123anime" || selectedServerEmbed.serverName === "luluvdo")) {
      console.log(`🚫 Preventing load of last fragment (SN: ${fragSequenceNumber}/${totalFragments})`);
      hls.stopLoad(); // Stop loading further fragments
      return; // Exit the handler to prevent further processing
    }

    goodBandwidthCounter++;
    console.log(`📶 Bandwidth #${goodBandwidthCounter}: ${formattedCounter}kbps (${fragHeight}p @ ${formattedStartTime})`);

    if (staffPermissionsRef.current.hasPlayerInfo) {
      setPlayerLog(`📶 Bandwidth #${goodBandwidthCounter}: ${formattedCounter}kbps (${fragHeight}p @ ${formattedStartTime})`);
    }

    // Track if quality is stuck
    if (fragHeight <= hlsConfig.lowQualityThreshold) {
      stuckQualityCounter++;
    } else if (fragHeight === 720) {
      stuckQualityCounter++;
    } else {
      stuckQualityCounter = 0;
    }

    // After X consecutive good measurements, try to increase quality
    if (goodBandwidthCounter >= hlsConfig.consecutiveGoodMeasurements) {
      const optimalLevel = findOptimalLevel();

      // More aggressive quality increase if quality is stuck
      if (((stuckQualityCounter > hlsConfig.stuckQualityThreshold && fragHeight <= hlsConfig.lowQualityThreshold) || 
          (stuckQualityCounter > hlsConfig.stuck720Threshold && fragHeight === 720)) && 
          fragHeight !== 0) {
        console.log(`↩️↩️ Force reset: Quality stuck at ${fragHeight}p for too long`);
        // Force to the highest available level
        hls.nextLoadLevel = hls.levels.length - 1;
        hls.nextAutoLevel = hls.levels.length - 1;
        stuckQualityCounter = 0;
        // To disable ABR, set the level selection mode
        hls.loadLevel = optimalLevel; // This forces the current level
        // Set a high bandwidth estimate
        hls.config.abrEwmaDefaultEstimate = 15000000; // 15 Mbps
        
        // After a delay, switch back to auto level selection
        setTimeout(() => {
          if (hls) {
            // To re-enable ABR, set loadLevel to -1
            hls.loadLevel = -1;
            console.log("🅰🆄🆃🅾✅Re-enabled ABR after forced quality change");
          }
        }, 10000); // 10 seconds
      } else if (optimalLevel > fragLevel) {
        console.log(`>> Forcing quality increase to level ${optimalLevel} (${hls.levels[optimalLevel].height}p)`);
        hls.nextLoadLevel = optimalLevel;
        hls.nextAutoLevel = optimalLevel;
      }
    }
  });

  hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
    // This event fires AFTER HLS has actually switched to a new quality level
    const actualLevel = data.level;
    const actualHeight = hls.levels[actualLevel]?.height;
    const actualBitrate = Math.round(hls.levels[actualLevel]?.bitrate / 1000);
    const currentTime = hls.media ? Math.round(hls.media.currentTime) : 0;
    const formattedTime = new Date(currentTime * 1000).toISOString().substr(14, 5); // Format as MM:SS

    console.log(`\nQuality Change Confirmed at ${formattedTime}:`);
    console.log(`➡️ Now playing: ${actualHeight}p (${actualBitrate} kbps)`);

    if (staffPermissionsRef.current.hasPlayerInfo) {
      setPlayerLogQuality(`➡️ Now playing: ${actualHeight}p (${actualBitrate} kbps) @ ${formattedTime}`);
    }
  });

  const qualityCheckInterval = setInterval(() => {
    if (!hls || hls.destroy) {
      clearInterval(qualityCheckInterval);
      return;
    }

    const bandwidthKbps = Math.round(hls.bandwidthEstimate / 1000);
    // If bandwidth is consistently good but we're still at low quality, force an upgrade
    if (bandwidthKbps > hlsConfig.goodBandwidthThreshold && hls.currentLevel < hls.levels.length - 2) {
      const optimalLevel = findOptimalLevel();
      if (optimalLevel > hls.currentLevel) {
        console.log(`... Periodic check: Forcing quality increase to level ${optimalLevel} (${hls.levels[optimalLevel].height}p)`);
        hls.nextLoadLevel = optimalLevel;
        hls.nextAutoLevel = optimalLevel;
      }
    }
  }, hlsConfig.qualityCheckInterval);

  // other initialization code...
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      artwork: [
        {
          src: backdropImage || "/backupback.jpg",
          sizes: "320x180", // The size must be exactly this
          type: "image/jpeg" // The MIME type of the artwork
        }
      ]
    });
  }

  hls.on(Hls.Events.FRAG_LOADED, function(event, data) {
    try {
      // Access stats from the correct location
      const stats = data.frag?._stats;
      
      if (stats) {
        // Calculate chunk size in MB
        const chunkSizeMB = (stats.loaded / (1024 * 1024)).toFixed(2);
        
        // Calculate loading time in seconds
        const loadTime = ((stats.loading?.end - stats.loading?.start) / 1000).toFixed(2);
  
        // Get fragment duration
        const fragDuration = data.frag?.duration 
          ? ` (duration: ${data.frag.duration.toFixed(2)}s)`
          : '';
  
          if (staffPermissionsRef.current.hasPlayerInfo) {
            setChunkLoadingInfo(
              `🧩 Chunk #${data.frag.sn}: ${chunkSizeMB}MB in ${loadTime}s${fragDuration}`
            );
          }
      }
    } catch (error) {
      console.warn('Error processing fragment load data:', error);
    }
  });
};

const handlePreviousEpisode = () => {
  const currentSeason = episode.season;
  const currentEpisodeNumber = episode.number;
  const episodes = seasonData[currentSeason];
  const currentIndex = episodes.findIndex((ep) => ep.number === currentEpisodeNumber);

  if (currentIndex > 0) {
    const previousEpisode = episodes[currentIndex - 1];
    setIsServerLoading(true);
    setEpisode(previousEpisode);
    // updateUrlParams(previousEpisode.season, previousEpisode.number);
    if (videoRef.current) {
      videoRef.current.pause();
    } else if (playerRef.current) {
      playerRef.current.pause();
    }
    localStorage.setItem(`lastPickedEpisodeV1_${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`, JSON.stringify(previousEpisode));
    if (user) {
      const userData = fetchUserData();
      const currentLastPicked = userData.userLastPickedEpisode || {};
      setDoc(doc(db, "users", user.uid), {
        userLastPickedEpisode: {
          ...currentLastPicked,
          [`${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`]: previousEpisode
        }
      }, { merge: true })
        .then(() => {
          console.log("Saved lastPickedEpisode to Firestore successfully!");
          // Set Firestore changed flag since we modified the database
          localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
        })
        .catch((error) => {
          console.error("Error saving to Firestore:", error.message);
        });
    }
  } else {
    const previousSeasons = Object.keys(seasonData).map(Number).sort((a, b) => a - b).filter((season) => season < currentSeason);
    if (previousSeasons.length > 0) {
      const previousSeasonEpisodes = seasonData[previousSeasons[previousSeasons.length - 1]];
      const previousEpisode = previousSeasonEpisodes[previousSeasonEpisodes.length - 1];
      setIsServerLoading(true);
      setEpisode(previousEpisode);
      // updateUrlParams(previousEpisode.season, previousEpisode.number);
      if (videoRef.current) {
        videoRef.current.pause();
      } else if (playerRef.current) {
        playerRef.current.pause();
      }
      localStorage.setItem(`lastPickedEpisodeV1_${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`, JSON.stringify(previousEpisode));
      if (user) {
        const userData = fetchUserData();
        const currentLastPicked = userData.userLastPickedEpisode || {};
        setDoc(doc(db, "users", user.uid), {
          userLastPickedEpisode: {
            ...currentLastPicked,
            [`${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`]: previousEpisode
          }
        }, { merge: true })
          .then(() => {
            console.log("Saved lastPickedEpisode to Firestore successfully!");
            // Set Firestore changed flag since we modified the database
            localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
          })
          .catch((error) => {
            console.error("Error saving to Firestore:", error.message);
          });
      }
    }
  }
};

const handleNextEpisode = () => {
  setIsNextEpisodeOverlay(false);
  setHasUserDismissedOverlay(false);

  const currentSeason = episode.season;
  const currentEpisodeNumber = episode.number;
  const episodes = seasonData[currentSeason];
  const currentIndex = episodes.findIndex((ep) => ep.number === currentEpisodeNumber);

  if (currentIndex < episodes.length - 1) {
    const nextEpisode = episodes[currentIndex + 1];
    setIsServerLoading(true);
    setEpisode(nextEpisode);
    // updateUrlParams(nextEpisode.season, nextEpisode.number);
    if (videoRef.current) {
      videoRef.current.pause();
    } else if (playerRef.current) {
      playerRef.current.pause();
    }
    localStorage.setItem(`lastPickedEpisodeV1_${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`, JSON.stringify(nextEpisode));
    if (user) {
      const userData = fetchUserData();
      const currentLastPicked = userData.userLastPickedEpisode || {};
      setDoc(doc(db, "users", user.uid), {
        userLastPickedEpisode: {
          ...currentLastPicked,
          [`${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`]: nextEpisode
        }
      }, { merge: true })
        .then(() => {
          console.log("Saved lastPickedEpisode to Firestore successfully!");
          // Set Firestore changed flag since we modified the database
          localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
        })
        .catch((error) => {
          console.error("Error saving to Firestore:", error.message);
        });
    }
  } else {
    const nextSeasons = Object.keys(seasonData)
      .map(Number) // Convert season numbers to integers
      .sort((a, b) => a - b) // Sort seasons numerically
      .filter((season) => season > currentSeason);

    if (nextSeasons.length > 0) {
      const nextSeasonEpisodes = seasonData[nextSeasons[0]];
      const nextEpisode = nextSeasonEpisodes[0];
      setIsServerLoading(true);
      setEpisode(nextEpisode);
      // updateUrlParams(nextEpisode.season, nextEpisode.number);
      if (videoRef.current) {
        videoRef.current.pause();
      } else if (playerRef.current) {
        playerRef.current.pause();
      }
      localStorage.setItem(`lastPickedEpisodeV1_${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`, JSON.stringify(nextEpisode));
      if (user) {
        const userData = fetchUserData();
        const currentLastPicked = userData.userLastPickedEpisode || {};
        setDoc(doc(db, "users", user.uid), {
          userLastPickedEpisode: {
            ...currentLastPicked,
            [`${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`]: nextEpisode
          }
        }, { merge: true })
          .then(() => {
            console.log("Saved lastPickedEpisode to Firestore successfully!");
            // Set Firestore changed flag since we modified the database
            localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
          })
          .catch((error) => {
            console.error("Error saving to Firestore:", error.message);
          });
      }
    }
  }
};



  const handleButtonClick = () => {
    setShowCommentBox(true);
    setButtonClicked(true); // Set buttonClicked to true when button is clicked
  };



  movieResults.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));



  useEffect(() => {
    for (const [season, episodes] of Object.entries(seasonData)) {
      const playingEpisodeExists = episodes.some((ep) => ep.id === episode.id);
      if (playingEpisodeExists) {
        setActiveSeason(season - 1);
      }
    }
  }, [seasonData]);


  function hasNonEmptyContent(text) {
    return text && text.trim() !== "";
  }


  useEffect(() => {
    if (movieDetails && movieDetails.releaseDate && movieDetails.type === "Movie") {
      // Calculate the new release year as per your requirement.
      const newReleaseYear = parseInt(movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : "") + 1;

      // Fetch the JSON data from the URL
      fetch(`https://raw.githubusercontent.com/streamamos/Oscars-Winners/main/winners-only/${newReleaseYear}.json`)
        .then((response) => response.json())
        .then((data) => {


          // Check if movieDetails.title is in winners or info arrays
          const movieAwards = data.filter((award) =>
            award.winners.includes(movieDetails.title) || award.info.includes(movieDetails.title)
          );
          

        if (movieAwards.length > 0) {
          setIsAwards(true);
          setImdbAwards(`https://www.imdb.com/event/ev0000003/${newReleaseYear}/1`);
          setAwards(movieAwards);
        }

        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        });
    }
  }, [movieDetails]);



  const handleServerClick = (serverNumber) => {
    if (selectedServer !== serverNumber) {
      clearServerAutoSwitchPending();
      if (videoRef.current) {
        videoRef.current.pause();
      } else if (playerRef.current) {
        playerRef.current.pause();
      }
      setSelectedServer(serverNumber);
      setIsManualServerSelection(true);
      setShowDivLoader(true); // Activate loader if it's a different server
    }
  };




  useEffect(() => {
    const selectedServerEmbed = filteredEnabledServers.find(server => server.serverNumber === selectedServer);
    if (selectedServerEmbed && selectedServerEmbed.serverName === "embed") {
      setShowIframeWarning(true)
      setIframeProgress(0);
      const timer = setInterval(() => {
        setIframeProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(timer); // Stop the timer when progress reaches 100
            return 100;
          }
          return prevProgress + 1; // Adjust increment to control speed
        });
      }, 150); // Set interval time to control overall duration
  
      return () => {
        clearInterval(timer); // Cleanup interval on unmount
      };
    }
  }, [selectedServer]);




  async function fetchM3U8(m3u8Link, { timeout = 15000, controller } = {}) {
    let timeoutId;
    try {
      // timeoutId = setTimeout(() => controller.abort(), timeout);
      // const response = await fetch(m3u8Link, { signal: controller.signal });
      // if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      // const text = await response.text();
  
      // const lines = text.split('\n');
      // const streams = [];
      // let lastStreamLabel = 'auto';
      // let hasResolution = false;
  
      // for (let i = 0; i < lines.length; i++) {
      //   const line = lines[i].trim();
  
      //   if (line && line.startsWith('#EXT-X-STREAM-INF')) {
      //     hasResolution = true;
      //     const resolutionMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
      //     if (resolutionMatch) {
      //       lastStreamLabel = resolutionMatch[2];
      //     }
      //   } else if (line && !line.startsWith('#')) {
      //     let streamLink;
      //     if (line.startsWith('https')) {
      //       streamLink = line;
      //     } else {
      //       const baseLink = m3u8Link.substring(0, m3u8Link.lastIndexOf('/') + 1);
      //       const cleanPath = line.startsWith('/') ? line.substring(1) : line;
      //       streamLink = baseLink + cleanPath;
      //     }
  
      //     // Check for duplicate labels and append (2) if needed
      //     const isDuplicate = streams.some(s => s.label === lastStreamLabel && lastStreamLabel !== 'auto');
      //     const finalLabel = isDuplicate ? `${lastStreamLabel} (2)` : lastStreamLabel;

      //     streams.push({ file: streamLink, label: finalLabel });
      //     lastStreamLabel = 'auto';
  
      //     streams.sort((a, b) => {
      //       const baseA = a.label.replace(' (2)', '');
      //       const baseB = b.label.replace(' (2)', '');
      //       const numA = isNaN(baseA) ? -Infinity : Number(baseA);
      //       const numB = isNaN(baseB) ? -Infinity : Number(baseB);
      //       if (numB !== numA) return numB - numA; // Sort by resolution descending
      //       return a.label.includes('(2)') ? 1 : -1; // Original before duplicate
      //     });
      //   }
      // }
  
      // if (!hasResolution) {
      //   return [{ file: m3u8Link, label: 'auto' }];
      // }

      // const filteredStreams = streams.filter(stream => stream.label !== 'auto');

      // console.log([{ file: m3u8Link, label: 'auto' }, ...filteredStreams]);
      // return [{ file: m3u8Link, label: 'auto' }, ...filteredStreams];
      return [{ file: m3u8Link, label: 'auto' }];
  
    } catch (error) {
      console.error('Error fetching m3u8:', error);
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
  
  
  
  



//SUBTITLES — only fetch once per movie/episode key, and only when embedUrls has a source
  useEffect(() => {
    if (movieDetails.id <= 0 || isVisible) return;
    if (movieDetails.type === "TV Series" && (!episode?.season || !episode?.number)) return;
    const hasEmbedSource = Boolean(embedUrls?.[0]?.file);
    if (!hasEmbedSource) return;

    const embedEpisodeKey =
      movieDetails.type === "Movie"
        ? "movie"
        : `s${episode.season}-e${episode.number}`;
    const subtitleFetchKey = movieDetails.type === "Movie"
      ? `movie-${movieDetails.id}-${embedEpisodeKey}`
      : `tv-${movieDetails.id}-${embedEpisodeKey}`;

    if (lastFetchedSubtitleKeyRef.current === subtitleFetchKey) return;

    if (subtitlesAbortControllerRef.current) {
      subtitlesAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    subtitlesAbortControllerRef.current = controller;
    const { signal } = controller;

    const markSubtitlesFetched = () => {
      if (!signal.aborted) {
        lastFetchedSubtitleKeyRef.current = subtitleFetchKey;
      }
    };

    const fetchFallbackSubtitle = async () => {
      const fallbackUrl = `https://gist.githubusercontent.com/streamamos/7245e253b30895d906a2eba2c9f7bab2/raw`;
      const fallbackResponse = await fetch(fallbackUrl, { signal });
      const fallbackData = await fallbackResponse.json();
      if (signal.aborted) return;
      setSubtitlesArray([{
        file: fallbackData.subtitles[0].url,
        language: fallbackData.subtitles[0].lang,
        lang: fallbackData.subtitles[0].lang,
      }]);
      markSubtitlesFetched();
    };

    const fetchDataSubtitles = async () => {
      try {
        let subtitlesUrl;
        if (movieDetails.type === "Movie") {
          subtitlesUrl = `${API_ENDPOINTS.STREAMAMOS_PROVIDERS}subtitles?keyword=${encodeURIComponent(movieDetails.title)}&tmdbid=${movieDetails.id}&year=${movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : ""}&season=0&episode=0&server=default`;
        } else {
          subtitlesUrl = `${API_ENDPOINTS.STREAMAMOS_PROVIDERS}subtitles?keyword=${encodeURIComponent(movieDetails.title)}&tmdbid=${movieDetails.id}&year=${movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : ""}&season=${episode.season}&episode=${episode.number}&server=default`;
        }

        //NECESSARY FOR VERCEL 10SEC FETCH MAX
        let subtitlesResponse = await fetch(subtitlesUrl, { signal });
        if (subtitlesResponse.status === 504) {
          subtitlesResponse = await fetch(subtitlesUrl, { signal });
        }

        const subtitlesData = await subtitlesResponse.json();
        if (signal.aborted) return;

        if (subtitlesData.sources && subtitlesData.sources.length > 0) {
          const subtitles = subtitlesData.sources.map((subtitle) => {
            let updatedFile = subtitle.file;
            if (subtitle.label.includes("v2")) {
              updatedFile = subtitle.file.replace("/download/", "/download/subencoding-utf8/");
            }

            return {
              file: updatedFile,
              language: `${subtitle.label}`,
              lang: `${subtitle.label}`,
            };
          });
          setSubtitlesArray(subtitles);
          markSubtitlesFetched();
        } else {
          await fetchFallbackSubtitle();
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.log("No subtitles");
        try {
          await fetchFallbackSubtitle();
        } catch (fallbackError) {
          if (fallbackError.name !== "AbortError") {
            console.log("No fallback subtitles");
          }
        }
      }
    };

    fetchDataSubtitles();

    return () => controller.abort();
  }, [movieDetails.id, movieDetails.type, movieDetails.title, movieDetails.releaseDate, episode?.id, episode?.season, episode?.number, isVisible, embedUrls?.[0]?.file]);


//SV1
useEffect(() => {
  const abortController = new AbortController();
  const { signal } = abortController;

  if (movieDetails.id > 0 && selectedServer !== null && isVisible === false) {
    setSourceUnavailable(false);
    setIsStillFetching(true);

    const fetchDataForServer = async (serverIndex) => {
      if (currentFetchController.current) {
        currentFetchController.current.abort();
      }
      const controller = new AbortController();
      currentFetchController.current = controller;

      const server = filteredEnabledServers[serverIndex];

      if (!server) {
        setIsStillFetching(false);
        setIsServerLoading(false);
        setSourceUnavailable(true);
        setEmbedUrls([]);
        return;
      }

      const { serverNumber, serverName, providerName, providerUrl, audio } = server;
      let timeoutId;

      try {
        setServerStates((prev) => ({ ...prev, [serverNumber]: 'loading' }));
        setIsServerLoading(true);

        timeoutId = setTimeout(() => {
          setServerStates((prev) => ({ ...prev, [serverNumber]: 'notWorking' }));
          setIsServerLoading(true);

          // Check if it's the last server in the list
          if (serverIndex === filteredEnabledServers.length - 1) {
            setSourceUnavailable(true);
            setEmbedUrls([]);
            setIsStillFetching(false); // Stop fetching since we've checked the last server
            setIsServerLoading(false);
            setIsIframe(false);
          } else if (!isManualServerSelection) {
            scheduleAutoServerSwitch();
          } else {
            setSourceUnavailable(true);
            setEmbedUrls([]);
            setIsStillFetching(false); // Stop fetching since we've checked the last server
            setIsServerLoading(false);
            setIsIframe(false);
          }
          console.error(`Loading for server ${serverNumber} exceeded 20 seconds.`);
        }, SERVER_FETCH_PROGRESS_MS);

        if (serverName === "embed") {
          let embedUrl = "";

          if (movieDetails.type === "Movie") {
            embedUrl = `${providerUrl.replace("{media_type}", "movie").replace("{tmdb}", `${movieDetails.id}`).replace("/{season}/{episode}", "").replace("&season={season}&episode={episode}", "").replace("?s={season}&e={episode}", "").replace("-{season}-{episode}", "")}`;
          } else if (movieDetails.type === "TV Series") {
            embedUrl = `${providerUrl.replace("{media_type}", "tv").replace("{tmdb}", `${movieDetails.id}`).replace("{season}", `${episode.season}`).replace("{episode}", `${episode.number}`)}`;
          }
          clearTimeout(timeoutId);
          setIsIframe(true);
          setEmbedUrls2([{ "file": embedUrl, "label": "auto" }]);
          setIsStillFetching(false);
          setIsServerLoading(false);
          setServerStates((prev) => ({ ...prev, [serverNumber]: 'working' }));

        } else {
          let apiUrl = "";

          if (movieDetails.type === "Movie") {
            apiUrl = `${(providerName === "flixhq" || providerName === "myflixerz") ? API_ENDPOINTS.STREAMAMOS_PROVIDERS_RENDER : API_ENDPOINTS.STREAMAMOS_PROVIDERS}providers/${providerName}?keyword=${encodeURIComponent(movieDetails.title)}&tmdbid=${movieDetails.id}&year=${movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : ""}&season=0&episode=0&server=${serverName}${audio ? `&audio=${audio}` : ''}`;
          } else if (movieDetails.type === "TV Series") {
            apiUrl = `${(providerName === "flixhq" || providerName === "myflixerz") ? API_ENDPOINTS.STREAMAMOS_PROVIDERS_RENDER : API_ENDPOINTS.STREAMAMOS_PROVIDERS}providers/${providerName}?keyword=${encodeURIComponent(movieDetails.title)}&tmdbid=${movieDetails.id}&year=${movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : ""}&season=${episode.season}&episode=${episode.number}&server=${serverName}${audio ? `&audio=${audio}&season_name=${encodeURIComponent(movieDetails.seasons.find(season => season.season_number === episode.season)?.name || '')}&episode_airdate=${episode.air_date}&episode_title=${encodeURIComponent(episode.title)}` : ''}`;
          }

          const response = await fetch(apiUrl, { signal });
          const data = await response.json();

          if (data && data.sources.source) {
            clearTimeout(timeoutId);
            let m3u8Link = "";
            let fetchedm3u8Link  = [];
            
            if (providerName === "tugakids" || providerName === "tugaflix" || providerName === "moviebox" || providerName === "pontv" || serverName === "streamtape" || serverName === "mixdrop" || serverName === "dood") {
              if (providerName === "tugakids") {
                m3u8Link = (providerName === "tugakids" ? API_ENDPOINTS.PROXY_MP4_LUSITANO : API_ENDPOINTS.PROXY_MP4_FEBBOX) + encodeURIComponent(data.sources.source);
              } else if (providerName === "moviebox" || serverName === "dood" || serverName === "mixdrop" || providerName === "pontv") { 
                const headers = {
                  referer: data.referer,
                  ...(data.additional_headers || {}),
                };                
                m3u8Link = API_ENDPOINTS.PROXY_M3U8_ZEF_MP4_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(JSON.stringify(headers)));
              } else {
                m3u8Link = data.sources.source;
              }
              setEmbedUrls([{ file: m3u8Link, label: 'auto', type: 'mp4' }]);
              setIsMP4(true);
              setIsIframe(false);
            } else {
              if (data.proxy === false) {

                try {
                  m3u8Link = data.sources.source;
                  fetchedm3u8Link = await fetchM3U8(m3u8Link, { timeout: 15000, controller });
                  setEmbedUrls(fetchedm3u8Link);
                  console.log(fetchedm3u8Link);
                  setIsMP4(false);
                  setIsIframe(false);
                } catch (e) {
                  // This will be called if fetchM3U8 times out or errors
                  setServerStates((prev) => ({ ...prev, [serverNumber]: 'notWorking' }));
                  scheduleAutoServerSwitch();
                  return;
                }
              } else {
                  if (serverName === "upcloud" && (providerName === "flixhq" || providerName === "myflixerz")) {

                        if (providerName === "flixhq") {

                          // const beforeM3u8Link = API_ENDPOINTS.PROXY_M3U8_ASIAFLIX2.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                          m3u8Link = API_ENDPOINTS.PROXY_M3U8_REF_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));

                          // const proxyEndpoint = localStorage.getItem('adminProxy') || API_ENDPOINTS.PROXY_M3U8_ASIAFLIX2;
                          // m3u8Link = proxyEndpoint
                          //   .replace("{m3u8Link}", encodeURIComponent(data.sources.source))
                          //   .replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                          
                        } else {
                          const urlParts = data.sources.source.split('/');
                          urlParts[2] = 'frostcomet5.pro';
                          const finalUrl = urlParts.join('/');
                          m3u8Link = API_ENDPOINTS.PROXY_M3U8_WAREZTUGA.replace("{m3u8Link}", encodeURIComponent(finalUrl)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                        }


                    // const urlParts = data.sources.source.split('/');
                    // urlParts[2] = 'turboquill734.xyz/clearflare66.live';
                    // const finalUrl = urlParts.join('/');
                    // m3u8Link = API_ENDPOINTS.PROXY_M3U8_MIRURO.replace("{m3u8Link}", encodeURIComponent(finalUrl)).replace("{headers}", encodeURIComponent(`{"referer":"https://111movies.com/"}`));



                    // //ONLY FOR MYFLIXERZ & from vidlink
                    //     // Get the original source URL
                    //     const sourceUrl = data.sources.source;
                    //     // Example: "https://stormflare89.xyz/file1/yW1KpJj1D1keT0kJCYO6g8ceJXp+VNGgv13V+0OFxnF0lSn2CLLHFQ3Szq82JcutXVM9idsocaWVXP13r7P9dbHEVAu~ZVxqX9aTNvb34OUTdlFclIIcGqfWH5We4zRBh2~HYTbdFVtqiQFuXFmSNh+PCxZ7dhOHTQcWhBV2kZ0=/cGxheWxpc3QubTN1OA==.m3u8"

                    //     // Extract the original domain for the host parameter
                    //     const originalDomain = sourceUrl.split('/')[2];
                    //     const originalHost = "https://" + originalDomain;

                    //     // Find the path part that comes after "/file1"
                    //     const file1Index = sourceUrl.indexOf('/file1');
                    //     const pathPart = sourceUrl.substring(file1Index + 6); // +6 to skip "/file1"
                    //     // This gives us: "/yW1KpJj1D1keT0kJCYO6g8ceJXp+VNGgv13V+0OFxnF0lSn2CLLHFQ3Szq82JcutXVM9idsocaWVXP13r7P9dbHEVAu~ZVxqX9aTNvb34OUTdlFclIIcGqfWH5We4zRBh2~HYTbdFVtqiQFuXFmSNh+PCxZ7dhOHTQcWhBV2kZ0=/cGxheWxpc3QubTN1OA==.m3u8"

                    //     // Encode the path part
                    //     const encodedPath = encodeURIComponent(pathPart);

                    //     // Construct the final firstProxyUrl
                    //     const firstProxyUrl = "https://storm.vodvidl.site/proxy/file2" + encodedPath + 
                    //         "?headers={%22referer%22:%22https://videostr.net/%22,%22origin%22:%22https://videostr.net%22}" +
                    //         "&host=" + originalHost;

                    //     // Then use it in the final m3u8Link
                    //     m3u8Link = API_ENDPOINTS.PROXY_M3U8_JEF_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(firstProxyUrl)).replace("{headers}", encodeURIComponent(`{"referer":"https://vidlink.pro/","user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"}`));

                  }
                    else if ((serverName === "vidcloud" || serverName === "megacloud") && (providerName === "flixhq" || providerName === "myflixerz")) {
                      m3u8Link = API_ENDPOINTS.PROXY_M3U8_REF_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));

                      // const beforeM3u8Link = API_ENDPOINTS.PROXY_M3U8_ANIMANGA.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                      // m3u8Link = API_ENDPOINTS.PROXY_M3U8_MIRURO.replace("{m3u8Link}", encodeURIComponent(beforeM3u8Link)).replace("{headers}", encodeURIComponent(`{"referer":"https://animanga.fun/"}`));
                    
                  } else if (providerName === "24drama" || providerName === "111movies") {
                    // const beforeM3u8Link = API_ENDPOINTS.PROXY_M3U8_CYPHER_2.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                    // m3u8Link = API_ENDPOINTS.PROXY_M3U8_MIRURO.replace("{m3u8Link}", encodeURIComponent(beforeM3u8Link)).replace("{headers}", encodeURIComponent(`{}`));
                    m3u8Link = API_ENDPOINTS.PROXY_M3U8_MIRURO.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                  } else if (providerName === "hexa" || providerName === "kisskh" || providerName === "moviesapi" || serverName === "filedecrypt") {
                    // const beforeM3u8Link = API_ENDPOINTS.PROXY_M3U8_ASIAFLIX2.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                    // m3u8Link = API_ENDPOINTS.PROXY_M3U8_JEF_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(beforeM3u8Link)).replace("{headers}", encodeURIComponent(`{"referer":"https://asiaflix.net/"}`));
                    m3u8Link = API_ENDPOINTS.PROXY_M3U8_ZEF_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                  } else if (providerName === "vidsrcme" || providerName === "vidlink" || providerName === "vaplayer" || providerName === "videasy" || serverName === "luluvdo" || providerName === "ridomovies") {
                    const headers = {
                      referer: data.referer,
                      ...(data.additional_headers || {}),
                    };    
                    m3u8Link = API_ENDPOINTS.PROXY_M3U8_REF_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(JSON.stringify(headers)));
                  } else if (serverName === "akcloud" || providerName === "m4u") {
                    m3u8Link = API_ENDPOINTS.PROXY_M3U8_REF_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                  } else if (providerName === "yflix" || providerName === "hianime" || providerName === "anikai" || providerName === "xpass" || providerName === "9anime" || providerName === "cinemacity" || serverName === "zoro" || serverName === "arc" || providerName === "vixsrc" || providerName === "lordflix" || serverName === "vidmoly" || serverName === "streamwish" || serverName === "filemoon" || providerName === "animedekho" || providerName === "vidfast") {
                    const headers = {
                      referer: data.referer,
                      ...(data.additional_headers || {}),
                    };                
                    m3u8Link = API_ENDPOINTS.PROXY_M3U8_JEF_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(JSON.stringify(headers)));
                  } else if (providerName === "kaa" ) {
                    m3u8Link = API_ENDPOINTS.PROXY_M3U8_JEF_2_STREAMAMOS.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"origin":"${data.origin}"}`));
                  } else {
                    // const beforeM3u8Link = API_ENDPOINTS.PROXY_M3U8_ASIAFLIX2.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(`{"referer":"${data.referer}"}`));
                    // m3u8Link = API_ENDPOINTS.PROXY_M3U8_MIRURO.replace("{m3u8Link}", encodeURIComponent(beforeM3u8Link)).replace("{headers}", encodeURIComponent(`{"referer":"https://asiaflix.net/"}`));
                  const headers = {
                    referer: data.referer,
                    ...(data.additional_headers || {}),
                  };                
                  m3u8Link = API_ENDPOINTS.PROXY_M3U8_MIRURO.replace("{m3u8Link}", encodeURIComponent(data.sources.source)).replace("{headers}", encodeURIComponent(JSON.stringify(headers)));
                  }

                try {
                  fetchedm3u8Link = await fetchM3U8(m3u8Link, { timeout: 15000, controller });
                  setEmbedUrls(fetchedm3u8Link);
                  setIsMP4(false);
                  setIsIframe(false);
                } catch (e) {
                  // This will be called if fetchM3U8 times out or errors
                  setServerStates((prev) => ({ ...prev, [serverNumber]: 'notWorking' }));
                  scheduleAutoServerSwitch();
                  return;
                }
              }
            }

            setServerStates((prev) => ({ ...prev, [serverNumber]: 'working' }));
            setIsServerLoading(false);
            setIsStillFetching(false); // Stop fetching when data is found
            setIsNextEpisodeOverlay(false);
            setHasUserDismissedOverlay(false);
          } else {
            clearTimeout(timeoutId);
            setServerStates((prev) => ({ ...prev, [serverNumber]: 'notWorking' }));
            setIsServerLoading(true);

            // Check if it's the last server in the list
            if (serverIndex === filteredEnabledServers.length - 1) {
              setSourceUnavailable(true);
              setEmbedUrls([]);
              setIsStillFetching(false); // Stop fetching since we've checked the last server
              setIsServerLoading(false);
              setIsIframe(false);
            } else if (!isManualServerSelection) {
              scheduleAutoServerSwitch();
            } else {
              setSourceUnavailable(true);
              setEmbedUrls([]);
              setIsStillFetching(false); // Stop fetching since we've checked the last server
              setIsServerLoading(false);
              setIsIframe(false);
            }
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          clearTimeout(timeoutId);
          const server = filteredEnabledServers[serverIndex];
          const serverNumber = server?.serverNumber;

          setServerStates((prev) => ({ ...prev, [serverNumber]: 'notWorking' }));
          setIsServerLoading(false);
        } else {
          clearTimeout(timeoutId);
          console.error('Error fetching data:', error);
          const server = filteredEnabledServers[serverIndex];
          const serverNumber = server?.serverNumber;

          setServerStates((prev) => ({ ...prev, [serverNumber]: 'notWorking' }));
          setIsServerLoading(false);

          // Handle error on the last server
          if (serverIndex === filteredEnabledServers.length - 1) {
            setSourceUnavailable(true);
            setEmbedUrls([]);
            setIsStillFetching(false); // Stop fetching since we've checked the last server
          } else if (!isManualServerSelection) {
            scheduleAutoServerSwitch();
          } else {
            setSourceUnavailable(true);
            setEmbedUrls([]);
            setIsStillFetching(false); // Stop fetching since we've checked the last server
            setIsServerLoading(false);
            setIsIframe(false);
          }
        }
      }
    };

    const tryServers = async (index = 0) => {
      if (index >= filteredEnabledServers.length) {
        setSourceUnavailable(true);
        setEmbedUrls([]);
        setIsStillFetching(false);
        setIsServerLoading(false);
        setIsIframe(false);
        return;
      }
      await fetchDataForServer(index);
    };

    tryServers(filteredEnabledServers.findIndex((server) => server.serverNumber === selectedServer));
    setPlayerLogQuality("");
    setPlayerLog("");
    setChunkLoadingInfo("");
  }

  return () => {
    clearServerAutoSwitchPending();
    abortController.abort(); // Abort the fetch when the component unmounts or when the dependencies change
  };
}, [movieDetails, episode, movieDetails.id, selectedServer, isVisible]);


useEffect(() => {
  return () => {
    if (currentFetchController.current) {
      currentFetchController.current.abort();
    }
  };
}, []);

const portugueseI18n = {
  controls: {
    play: 'Reproduzir ({{shortcut}})',
    pause: 'Pausar ({{shortcut}})',
    forward: 'Avançar {{time}} Segundos',
    backward: 'Retroceder {{time}} Segundos',
    enableSubtitle: 'Ativar Legendas',
    disableSubtitle: 'Desativar Legendas',
    settings: 'Definições',
    enterFullscreen: 'Ativar Ecrã Inteiro ({{shortcut}})',
    exitFullscreen: 'Desativar Ecrã Inteiro ({{shortcut}})',
    muteVolume: 'Desativar Som ({{shortcut}})',
    unmuteVolume: 'Ativar Som ({{shortcut}})',
    sliderDragMessage: 'Arrasta para Procurar',
    screenshot: 'Captura de Ecrã',
  },
  settings: {
    audio: 'Áudio',
    playbackSpeed: 'Velocidade de Reprodução',
    quality: 'Qualidade',
    subtitle: 'Legenda',
    subtitleSettings: 'Personalização',
    reset: 'Repor',
    none: 'Nenhum',
    off: 'Desligada',
    onBlur: 'Ativado',
    offBlur: 'Desativado',
    subtitleBackgroundOpacity: 'Opacidade do Fundo',
    subtitleBackgroundBlur: 'Desfoque do Fundo',
    subtitleFontOpacity: 'Opacidade da Fonte',
    subtitleFontSize: 'Tamanho da Fonte',
    subtitleTextStyle: 'Estilo do Texto',
    subtitleSync: 'Sincronizar',
    subtitleSyncNoDelay: 'Legenda sem Delay',
    subtitleSyncHeading: 'Delay da Legenda',
    subtitleTextColor: 'Cor do Texto',
    apply: 'Repor 0ms',
    cancel: 'Cancelar',
    tooEarly: 'Legendas aparecem {{miliseconds}}ms mais tarde',
    tooLate: 'Legendas aparecem {{miliseconds}}ms mais cedo',
    uploadSubtitle: 'Carregar Legenda',
    mySubtitle: 'A Minha Legenda',
    recommended: 'Recomendado',
    hideTranscript: 'Ocultar Transcrição',
    showTranscript: 'Dificuldade em sincronizar? Mostrar Transcrição',
    transcriptTip: 'Dica: Pausa o vídeo no início da fala da personagem e clica na legenda específica para uma melhor sincronização',
    subtitleInfo: 'Podes sincronizar ou customizar a legenda na aba "Personalização"',
  },
};


const VidstackPortugueseI18n = {
  'Current time': 'Tempo',
  'Disable captions': 'Desativar',
  'Enable captions': 'Ligar',
  'Enter Fullscreen': 'Ativar Ecrã Inteiro',
  'Enter PiP': 'Ativar Ecrã no Ecrã',
  'Exit Fullscreen': 'Desativar Ecrã Inteiro',
  'Exit PiP': 'Desativar Ecrã no Ecrã',
  'Go back to previous menu': 'Voltar Atrás',
  Ad: 'Anúncio',
  AirPlay: 'AirPlay',
  All: 'All',
  Audio: 'Áudio',
  Auto: 'Auto',
  Buffered: 'Buffered',
  Captions: 'Legendas',
  Default: 'Buffered',
  Disabled: 'Desligada',
  Download: 'Download',
  Duration: 'Duração',
  Enabled: 'Ligada',
  End: 'Fim',
  Forward: 'Forward',
  LIVE: 'LIVE',
  Loop: 'Loop',
  Mute: 'Mute',
  Normal: 'Normal',
  Pause: 'Pausar',
  Play: 'Reproduzir',
  Played: '',
  Quality: 'Qualidade',
  Reset: 'Reset',
  Restart: 'Reiniciar',
  Rewind: 'Rewind',
  Seek: 'Procurar',
  Settings: 'Definições',
  Speed: 'Velocidade',
  Start: 'Começar',
  Unmute: 'Tirar Mute',
  Volume: 'Volume',
};

// First, add this function near your other functions
const getNextMovie = () => {
  if (movieDetails.type === "Movie") {
    // // Try to find current movie index in movieResults2, only considering movies and excluding shorts
    // const filteredMovies = movieResults2.filter(movie => 
    //   movie.type === "Movie" && movie.type2 !== "Short"
    // );
    // const currentIndex2 = filteredMovies.findIndex(movie => movie.id === movieDetails.id);
    // if (currentIndex2 !== -1 && currentIndex2 < filteredMovies.length - 1) {
    //   return filteredMovies[currentIndex2 + 1];
    // }
    
    // If not found in movieResults2, try movieResults
    const currentIndex = movieResults.findIndex(movie => movie.id === movieDetails.id);
    if (currentIndex !== -1 && currentIndex < movieResults.length - 1) {
      return movieResults[currentIndex + 1];
    }
  }
  return null;
};

const renderContent = () => {
  if (!isLoading && selectedServer) { // Dynamically get loading state for the selected server
    if (sourceUnavailable) {
      return (
        <div className={styles.sourceUnavailableDiv}>
          <img
                src="/noSource.gif"
                className={styles.sourceUnavailableImg}
                alt="404Error"
                onLoad={({ currentTarget }) => {
                  currentTarget.style.opacity = "0.5";}}
                style={{ opacity: 0, transition: "opacity 0.2s ease-in" }}
                onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = "https://htmlcolors.com/color-image/292929.png";
                }}
              />
          <div className={styles.sourceUnavailableMessage}>
            <p className={styles.sourceUnavailable404}>404</p>
            <p className={styles.sourceUnavailablep1}>Fonte Indisponível</p>
            <p className={styles.sourceUnavailablep2}>Tenta outro servidor</p>
          </div>
        </div>
      );
    }

    const embedUrl = embedUrls; // Dynamically get embedUrl for the selected server
    const hasDirectSource = Boolean(embedUrl?.[0]?.file);
    const hasIframeSource = Boolean(embedUrls2?.[0]?.file);
    // While fetching with no URL yet, parent shows "À Procura de Fontes…"; keep NetPlayer mounted when we still have a previous URL (fullscreen).
    if (!isIframe && !hasDirectSource) {
      if (isStillFetching) return null;
      return (
        <div className={`${styles.loader} ${styles.loadervideo}`}>
          <div className={styles.loader4}></div>
        </div>
      );
    }
    if (isIframe && !hasIframeSource) {
      if (isStillFetching) return null;
      return (
        <div className={`${styles.loader} ${styles.loadervideo}`}>
          <div className={styles.loader4}></div>
        </div>
      );
    }

    return (
      <>
        {(showDivLoader || isServerLoading) && (
          <div className={`${styles.loader} ${styles.loadervideo}`}>
            <div className={styles.loader4}></div>
          </div>
        )}
        {!isIframe ? (
          isIOS ? (
            <>
              <MediaPlayer
                key={`${movieDetails.title}-${movieDetails.type === "TV Series" ? episode.id : ""}`}
                ref={playerRef}
                title={movieDetails.title}
                src={embedUrl[0].file}
                playsInline
                crossOrigin
                autoPlay
                onLoadedMetadata={handleVidstackPlayerInit}
                onTimeUpdate={handleTimeUpdateVidstack}
              >
                <MediaProvider>
                  {subtitlesArray.map((track, index) => {
                      const ext = track.file.split('.').pop().toLowerCase();
                      const isSrt = ext === 'srt';
                      const isUtf8 = track.lang?.includes('v0') || track.lang?.includes('v1') || track.lang?.includes('(EN');
                      return (
                        <Track
                          {...{
                            ...track,
                            src: track.file,
                            label: track.lang,
                            kind: "subtitles",
                            type: isSrt ? "srt" : "vtt",
                            encoding: isUtf8 ? "utf-8" : "windows-1252",
                            default: index === 0
                          }}
                          key={`${track.lang}-${index}`}
                        />
                      );
                    })}
                </MediaProvider>
                <PlyrLayout icons={plyrLayoutIcons} translations={VidstackPortugueseI18n} />
              </MediaPlayer>
            </>
          ) : (
            <NetPlayer
            ref={videoRef}
            sources={embedUrl}
            subtitles={subtitlesArray}
            skipsegments={skipSegments}
            hlsConfig={!isMP4 ? {
              // debug: true,
              minAutoBitrate: 0,
              lowLatencyMode: true,
              maxMaxBufferLength: 180,
              maxBufferLength: 180,
              maxBufferSize: 200 * 1024 * 1024,
              nudgeOffset: 1.0,
              nudgeMaxRetry: 5,
              abrBandWidthFactor: 0.99,
              abrBandWidthUpFactor: 0.9,
              ignoreDevicePixelRatio: true,
              fragLoadPolicy: {
                default: {
                  maxLoadTimeMs: 10000,
                  timeoutRetry: {
                    maxNumRetry: 1,
                    retryDelayMs: 0,
                    maxRetryDelayMs: 0,
                  },
                },
              },
              
            } : undefined}
            autoPlay={true}
            onInit={handleTimeUpdateNetplayer}
            i18n={portugueseI18n}
            onHlsInit={handleHlsInit}
            components={movieDetails.type === "TV Series" || movieDetails.type === "Movie"  ? {
              Overlay: windowWidth >= 1025 ? () => (
                <>
                  <Overlay />
                  <div className={styles.overlayDiv}>
                    {(showDivLoader || isServerLoading) && (
                      <div className={`${styles.loader} ${styles.loadervideo}`}>
                        <div className={styles.loader4}></div>
                      </div>
                    )}
                    {currentSkipSegment && (
                      <div className={styles.overlayButtons1}>
                        <button onClick={handleSkipSegment} title="Pode não funcionar corretamente em todos os servidores">
                          <RiSkipRightLine size={28} /> 
                          <p className={styles.overlayNextPTag}>
                            {currentSkipSegment.type === 'intro' && 'Pular Intro'}
                            {currentSkipSegment.type === 'recap' && 'Pular Resumo'}
                          </p>
                          <span className={styles.overlayNextDev}>*Em Beta</span>
                        </button>
                      </div>
                    )}
                    {isNextEpisodeOverlay && !hasUserDismissedOverlay && (
                      <div className={styles.overlayButtons}>
                       <button 
                          onClick={() => setHasUserDismissedOverlay(true)}
                          className={styles.closeOverlayButton}
                        >
                          X
                        </button>
                        <button onClick={movieDetails.type === "Movie" ? () => navigate(`/watch?id=${getNextMovie()?.cleanId}`) : nextEpisodeOverlay}>
                          <BiSkipNext size={36} /> 
                          <p className={styles.overlayNextPTag}>{movieDetails.type === "Movie" ? "Próximo Filme" : "Próximo Episódio"}
                            {movieDetails.type === "Movie" && (
                            <p className={styles.overlayMovieTitle}>{`${getNextMovie()?.title} (${getNextMovie()?.releaseDate.substring(0, 4)})`}</p>
                          )}</p>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : null,
              MobileForwardIndicator: windowWidth < 1025 ? () => (
                <>
                  <div className={styles.overlayDiv}>
                    {(showDivLoader || isServerLoading) && (
                      <div className={`${styles.loader} ${styles.loadervideo}`}>
                        <div className={styles.loader4}></div>
                      </div>
                    )}
                    {currentSkipSegment && (
                      <div className={styles.overlayButtons1}>
                        <button onClick={handleSkipSegment} title="Pode não funcionar corretamente em todos os servidores">
                          <RiSkipRightLine size={28} /> 
                          <p className={styles.overlayNextPTag}>
                            {currentSkipSegment.type === 'intro' && 'Pular Intro'}
                            {currentSkipSegment.type === 'recap' && 'Pular Resumo'}
                          </p>
                          <span className={styles.overlayNextDev}>*Em Beta</span>
                        </button>
                      </div>
                    )}
                    {isNextEpisodeOverlay && !hasUserDismissedOverlay && (
                      <div className={styles.overlayButtons}>
                       <button 
                          onClick={() => setHasUserDismissedOverlay(true)}
                          className={styles.closeOverlayButton}
                        >
                          X
                        </button>
                        <button onClick={movieDetails.type === "Movie" ? () => navigate(`/watch?id=${getNextMovie()?.cleanId}`) : nextEpisodeOverlay}>
                          <BiSkipNext size={36} /> 
                          <p className={styles.overlayNextPTag}>{movieDetails.type === "Movie" ? "Próximo Filme" : "Próximo Episódio"}
                            {movieDetails.type === "Movie" && (
                            <p className={styles.overlayMovieTitle}>{`${getNextMovie()?.title} (${getNextMovie()?.releaseDate.substring(0, 4)})`}</p>
                          )}</p>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : null,
            } : undefined}
          />
          )
        ) : (
          <>
            {iframeProgress < 100 && showIframeWarning && (
            <div className={styles.iframeWarning} onClick={() => setShowIframeWarning(false)}>
              <LinearProgress className={styles.iframeWarningProgress} variant="determinate" value={iframeProgress}/>
              <p className={styles.iframeWarningText}>{`⚠ Servidores "Ad" (chamados "Embeds") podem incluir anúncios e não contêm muitas das funcionalidades do nosso player. Não temos forma de controlar isto.`}</p>
              </div>
            )}
            <iframe src={embedUrls2[0].file} className={styles.embedIframe} allowFullScreen={true} />
          </>
        )}
      </>
    );
  }
};





return (
  <div className={`${styles.mainDiv} pngbackground`}>
    {/* <Snackbar
      open={resizeNoticeVisible}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      message="⚠ Foi detetado um redimensionamento significativo. Clica para recarregar a página e evitar possíveis erros."
      sx={{
        width: '90%',
        margin: '0 auto',
      }}
      ContentProps={{
        sx: {
          backgroundColor: 'var(--orange)',
          color: 'var(--darkBlack)',
          fontFamily: 'Mulish',
          fontSize: '14px',
          fontWeight: 600,
          marginTop: '70px',
          borderRadius: '10px',
          cursor: 'pointer',
        },
      }}
      onClick={() => {
        try {
          window.location.reload();
        } catch (e) {
          console.warn('Erro ao recarregar a página após redimensionamento:', e);
        }
      }}
    /> */}
    <div className={styles.movieDetails}>
      {isLoading ? (
        <div className={styles.loader}>
          <div className={styles.loader2}>
          </div>
          {oneMoment && (
            <div className={styles.mensagemLoader}>
              Aguarda um momento...
            </div>
            )}
          {showNotLoading && (
            <div className={styles.mensagemLoader}>
              {`O Streamamos não está a conseguir encontrar ${movieDetails.type === 'TV Series' ? 'esta série' : 'este filme'}.`}
              <div>Atualiza a página ou tenta mais tarde.</div>
              <div className={styles.divMensagemButton}>
              <button className={styles.mensagemButton} onClick={() => { navigate("/") }}><GoHome size={20}/></button>
              <button className={styles.mensagemButton} onClick={() => { navigate(-1) }}><IoArrowBack size={20}/> Voltar Atrás</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
            {isVisible ? (<div className={styles.visibleDiv}>
            <img
                src={backdropImageVisible}
                className={styles.movieImageVisible}
                alt={movieDetails.title}
                onLoad={({ currentTarget }) => {
                  currentTarget.style.opacity = "0.25";}}
                style={{ opacity: 0, transition: "opacity 0.2s ease-in" }}
                onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = "https://htmlcolors.com/color-image/292929.png";
                }}
              />
              {windowWidth >= 1025 && (
                <div className={styles.youtubeToggleContainer}>
                  <button
                    onClick={toggleYoutubePreview}
                    className={styles.youtubeToggleButton}
                    title={youtubePreviewEnabled ? 'Desativar prévia do YouTube' : 'Ativar prévia do YouTube'}
                  >
                    <div className={`${styles.youtubeToggleTrack} ${youtubePreviewEnabled ? styles.youtubeToggleTrackActive : ''}`}>
                      <div className={`${styles.youtubeToggleThumb} ${youtubePreviewEnabled ? styles.youtubeToggleThumbActive : ''}`}>
                      </div>
                    </div>
                  </button>
                  <p><b>{youtubePreviewEnabled ? "Desativar" : 'Ativar'}</b> Prévia</p>
                </div>
              )}
              {windowWidth >= 1025 && trailerVideoId && showTrailerPreview && youtubePreviewEnabled && (
                <>
                  <div
                    ref={trailerContainerRef}
                    className={styles.trailerYoutubeEmbed}
                  />
                  <div className={styles.trailerYtControls}>
                    <button
                      type="button"
                      onClick={toggleTrailerPlay}
                      className={styles.trailerYtButton}
                      title={trailerPlaying ? "Pausar teaser" : "Reproduzir teaser"}
                    >
                      {trailerPlaying ? <BsPauseFill size={20} /> : <BsFillPlayFill size={20} />}
                    </button>
                    <button
                      type="button"
                      onClick={toggleTrailerMute}
                      className={styles.trailerYtButton}
                      title={trailerMuted ? "Ativar som" : "Desativar som"}
                    >
                      {trailerMuted ? <BsVolumeMuteFill size={20} /> : <BsVolumeUpFill size={20} />}
                    </button>
                  </div>
                </>
              )}
              <div className={styles.visibleDivButtons}>
      {(user && movieDetails.releaseDate) ? (    
<>
              {isFavorited ? (
                <div className={styles.sideButtonsPlay}>
                <button onClick={handleButtonFavoriteClick} className={styles.favButton}>
                  <MdOutlineFavorite size={25} />
                </button>
                <p>Remover Favorito</p>
                </div>
              ) : (
                <div className={styles.sideButtonsPlay}>
                <button onClick={handleButtonFavoriteClick} className={styles.nofavButton}>
                  <MdOutlineFavoriteBorder size={25} />
                </button>
                <p>Adicionar Favorito</p>
                </div>
              )}
          </>
          ) : (
            <div className={styles.sideButtonsPlay} >
          <ClickAwayListener onClickAway={handleTooltipClose}>
          <div>
          <CustomWidthTooltipSv
            onClose={handleTooltipClose}
            open={openTooltip}
            disableFocusListener
            disableHoverListener
            disableTouchListener
            title={movieDetails.releaseDate ? "⚠ Disponível apenas para utilizadores registados" : "⚠ Disponível brevemente"}
            slotProps={{
              popper: {
                disablePortal: true,
              },
            }}
          >
            <button onClick={handleTooltipOpen} className={styles.nofavButton} style={{opacity: "0.5"}}>

              <MdOutlineFavoriteBorder size={25} />
            </button>
          </CustomWidthTooltipSv>
          </div>
          </ClickAwayListener>
          <p style={{opacity: "0.5"}}>Adicionar Favorito</p>
            </div>
          )}

          {((movieDetails.type === "Movie" && new Date(movieDetails.releaseDate) <= new Date()) || bypassMovieIds.includes(movieDetails.id) || movieDetails.episodes.filter(ep => ep.isReleased).length > 0) ? (
            showPulseButton ? (
              <button className={styles.pulseButton} onClick={handleVisibleClick}>
                <FaPlay size={30}/>
              </button>
            ) : (
              <CircularProgress className={styles.pulseButtonLoader} />
            )
          ) : (
            <div className={styles.notAvailableYet}>
              <p>Disponível Brevemente</p>
              <span>{formatReleaseDateFull(movieDetails.releaseDate) || "TBD"}</span>
            </div>
          )}

              
              <div className={styles.sideButtonsPlay}>
              <a href={trailer || `https://www.youtube.com/results?search_query=${encodeURIComponent(movieDetails.title)}+${movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : ""}+Trailer`} target="_blank" rel="noreferrer" className={styles.trailerButton}>
                  <AiFillYoutube size={25} />
              </a>
              <p>Ver Trailer</p>
              </div>


              </div>

            <div className={styles.bounceTop}>{`${((movieDetails.type === "Movie" && new Date(movieDetails.releaseDate) <= new Date()) || movieDetails.episodes.filter(ep => ep.isReleased).length > 0) ? 'Começa a ver... Ou' : 'Por enquanto...'} descobre mais sobre ${movieDetails.type === 'TV Series' ? 'esta série' : 'este filme'}`}<FaChevronDown /></div>
            </div>
            ) : (
              <div className={styles.videoDivContainer}>
              <div className={styles.videoDiv}>

              <div className={isCinemaMode ? styles.video2 : styles.video}>

              {playerLog && (
                  <p style={{position: "absolute", top: isCinemaMode ? 20 : 5, right: isCinemaMode ? 75 : 5, zIndex: 1, backgroundColor: "#292929", padding: 5, borderRadius: 8, opacity: "30%"}}>{playerLog}</p>
                )}

          {playerLogQuality && (
                  <p style={{position: "absolute", top: isCinemaMode ? 50 : 35, right: isCinemaMode ? 75 : 5, zIndex: 1, backgroundColor: "#292929", padding: 5, borderRadius: 8, opacity: "30%"}}>{playerLogQuality}</p>
                )}

                {chunkLoadingInfo && (
                  <p style={{position: "absolute", top: isCinemaMode ? 80 : 65, right: isCinemaMode ? 75 : 5, zIndex: 1, backgroundColor: "#292929", padding: 5, borderRadius: 8, opacity: "30%"}}>{chunkLoadingInfo}</p>
                )}

                {isStillFetching && (
                  <div className={`${styles.loader} ${styles.loadervideo}`}>
                  {pngLogo !== null && (
                      <img className={`${styles.pngLogo} ${styles.pulseLogo}`} src={pngLogo} alt={movieDetails.title} />
                   )}
                     <div className={styles.loader3}></div>
                     <div className={styles.loaderText}>
                     À Procura de Fontes...
                     {currentServerName && (
                       <div className={`${styles.serverNameDisplay} ${isServerNameAnimating ? styles.serverNameAnimating : ''}`}>
                         <TbServerBolt size={16}/>{currentServerName} {serverFetchProgress}%
                       </div>
                     )}
                     </div>
                  </div>
                )}
                <>{renderContent()}</>

                                
              </div>
              <div className={styles.buttonsDiv} style={{justifyContent: movieDetails.type === "TV Series" ? "space-between" : "flex-end"}}>
                {movieDetails.type === "TV Series" && (
                        <div className={styles.prevnextBotoes}>
                            <button onClick={handlePreviousEpisode} className={styles.prevButton} title="Episódio Anterior"><BiSkipPrevious size={36}/></button>
                            <button onClick={handleNextEpisode} title="Próximo Episódio"><BiSkipNext size={36}/><p>Próximo Episódio</p></button>
                        </div>
                )}

                        <div className={styles.botaoReverseAndThumbnail}>
                        {(user && movieDetails.releaseDate) ? (    
                <>
                      {isFavorited ? (
                            <button onClick={handleButtonFavoriteClick} className={`${styles.thumbnailButton} ${styles.favoriButton}`} title="Remover Favorito">
                              <MdOutlineFavorite size={20} />
                              <p>Remover Favorito</p>
                            </button>
                          ) : (
                            <button onClick={handleButtonFavoriteClick} className={`${styles.thumbnailButton} ${styles.favoriButton}`} title="Adicionar Favorito">
                              <MdOutlineFavoriteBorder size={20} />
                              <p>Adicionar Favorito</p>
                            </button>
                          )}
                            </>
                            ) : (
                              <div>
                            <ClickAwayListener onClickAway={handleTooltipClose}>
                            <div>
                            <CustomWidthTooltipSvMobile
                              onClose={handleTooltipClose}
                              open={openTooltip}
                              placement="left-start"
                              disableFocusListener
                              disableHoverListener
                              disableTouchListener
                              title={movieDetails.releaseDate ? "⚠ Disponível apenas para utilizadores registados" : "⚠ Disponível brevemente"}
                              slotProps={{
                                popper: {
                                  disablePortal: true,
                                },
                              }}
                            >
                                              <button onClick={handleTooltipOpen} className={`${styles.thumbnailButton} ${styles.favoriButton} ${styles.favoriButtonDisabled}`} style={{opacity: "0.85"}}>
                                                <MdOutlineFavoriteBorder size={20} />
                                                <p>Adicionar Favorito</p>
                                              </button>
                            </CustomWidthTooltipSvMobile>
                            </div>
                            </ClickAwayListener>
                              </div>
                            )}
                          <button onClick={toggleCinemaMode} className={isCinemaMode ? styles.cinemaButton2 : styles.cinemaButton} title="Ativar/Desativar Modo Cinema"><FaLightbulb size={16}/><p>Modo Cinema</p></button>
                          {/* <button onClick={toggleAccordionStyle} className={styles.botaoReverseColumn} title="Inverter Ordem das Temporadas"><TbArrowsDownUp size={16}/></button> */}

                          {movieDetails.type === "TV Series" ? (
                          <button onClick={toggleThumbnailStyle} className={styles.thumbnailButton} title="Ativar/Desativar Informação dos Episódios"><LuGalleryThumbnails size={16}/><p>{thumbnailStyle === "none" ? "Desativar Modo Anti-Spoiler" : "Ativar Modo Anti-Spoiler"}</p></button>
                        ) : (
                          <button onClick={handleDownloadClick} className={`${styles.thumbnailButton} ${styles.downloadButton}`} title="Opções de Download">
                          <FiDownload size={16} /><p>Opções de Download</p></button>
                        )}



                        </div>
                      </div>

                      </div>
    
              {movieDetails.type === "Movie" ? (
                  <div className={styles.rightDiv}>
                      {backdropImageVisible && (
                        <img src={backdropImageVisible} className={styles.episodeImage} style={{ display: thumbnailStyle }} onError={({ currentTarget }) => {
                          currentTarget.onerror = null;
                          currentTarget.src = "/backupback.jpg";
                        }} />
                      )}
                      <div className={styles.episodeTitleandBotoesDiv}>
                    <div className={styles.episodeTitleandBotoes}>
                    <div className={`${styles.episodeTitle} ${styles.episodeTitleMovie}`} style={{borderRadius: '8px'}}>
                      <div className={styles.episodeTitleWatching}>Estás a ver: "{movieDetails.title}"</div>
                    </div>
                    </div>
                    </div>
                    {releaseDateUS != null && releaseDateUS !== "" ? (
                      <>
                        <div className={styles.rightDivTabBar} role="tablist" aria-label="Informação e servidores">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={rightDivTabMovie === 0}
                            className={`${styles.rightDivTabBtn} ${rightDivTabMovie === 0 ? styles.rightDivTabBtnActive : ""}`}
                            onClick={() => setRightDivTabMovie(0)}
                          >
                            <PiHighDefinitionFill size={18} />Versão
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={rightDivTabMovie === 1}
                            className={`${styles.rightDivTabBtn} ${rightDivTabMovie === 1 ? styles.rightDivTabBtnActive : ""}`}
                            onClick={() => setRightDivTabMovie(1)}
                          >
                            <TbServer size={18} />Servidores
                          </button>
                        </div>
                        <div className={styles.rightDivTabPanels}>
                          <div
                            className={`${styles.rightDivTabPanel} ${rightDivTabMovie === 0 ? styles.rightDivTabPanelActive : styles.rightDivTabPanelInactive}`}
                            role="tabpanel"
                            hidden={rightDivTabMovie !== 0}
                          >
                            <div className={styles.rightDivTabPanelInner}>{releaseDateUS}</div>
                          </div>
                          <div
                            className={`${styles.rightDivTabPanel} ${rightDivTabMovie === 1 ? styles.rightDivTabPanelActive : styles.rightDivTabPanelInactive}`}
                            role="tabpanel"
                            hidden={rightDivTabMovie !== 1}
                          >
                            {rightDivTabMovie === 1 && (
                              <div
                                className={`${styles.serversDivMovies} ${styles.serversDivMovies4}`}
                                ref={serversListRef}
                              >
                                {renderRightDivServerButtons()}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.rightDivTabBar} role="tablist" aria-label="Servidores">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={true}
                            aria-controls="movie-servers-only-tabpanel"
                            className={`${styles.rightDivTabBtn} ${styles.rightDivTabBtnActive}`}
                          >
                            <TbServer size={18} />
                            Servidores
                          </button>
                        </div>
                        <div className={styles.rightDivTabPanels}>
                          <div
                            className={`${styles.rightDivTabPanel} ${styles.rightDivTabPanelActive}`}
                            role="tabpanel"
                            id="movie-servers-only-tabpanel"
                          >
                            <div
                              className={`${styles.serversDivMovies} ${styles.serversDivMovies4}`}
                              ref={serversListRef}
                            >
                              {renderRightDivServerButtons()}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                  </div>
                ) : (
                  ""
                )}
              
    
    
          {movieDetails.type === "TV Series" ? (
                  <div className={styles.rightDiv}>
                      {episode.still_path && (
                        <img src={`${API_ENDPOINTS.TMDB_IMG_URL}w300${episode.still_path}`} className={styles.episodeImage} style={{ display: thumbnailStyle }} onError={({ currentTarget }) => {
                          currentTarget.onerror = null;
                          currentTarget.src = "/backupback.jpg";
                        }} />
                      )}
                    <div className={styles.episodeTitleandBotoesDiv}>
                      <div className={styles.episodeTitleandBotoes}>
                      <div className={styles.episodeTitle} style={(moreEpisodeInfo && thumbnailStyle !== "none" && windowWidth >= 1025) ? {borderRadius: '8px 8px 0px 0px'} : {borderRadius: '8px'}}>
                        <div className={styles.episodeTitleWatching}>Estás a ver: "{movieDetails.title}"</div> 
                        <p className={styles.episodeTitleCount} title={`Temporada ${episode.season} Episódio ${episode.number} : ${episode.title} `}>
                          Temporada {episode.season}: Episódio {episode.number} {thumbnailStyle !== "none" && (<button className={styles.episodeInfoButton} title="Sinopse do Episódio" onClick={toggleEpisodeInfo}><IoMdInformationCircle size={18} /></button>)}
                          </p>
                      </div>
                      {(moreEpisodeInfo && thumbnailStyle !== "none") && (
                            <p className={`${styles.episodeTitleCount} ${styles.episodeOverview}`}>
                              <b>{episode.title || "N/A"}</b>: {episode.overview || "N/A"}
                            </p>
                          )}
                      </div>

                      </div>  
                      
                  <div className={styles.rightDivTabBar} role="tablist" aria-label="Episódios e servidores">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={rightDivTabSeries === 0}
                      className={`${styles.rightDivTabBtn} ${rightDivTabSeries === 0 ? styles.rightDivTabBtnActive : ""}`}
                      onClick={() => setRightDivTabSeries(0)}
                    >
                      <TbBoxMultiple size={18} />Episódios
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={rightDivTabSeries === 1}
                      className={`${styles.rightDivTabBtn} ${rightDivTabSeries === 1 ? styles.rightDivTabBtnActive : ""}`}
                      onClick={() => setRightDivTabSeries(1)}
                    >
                      <TbServer size={18} />Servidores
                    </button>
                  </div>

                  <div className={styles.rightDivTabPanelsSeries}>
                    <div className={styles.seasonsList} role="tabpanel" hidden={rightDivTabSeries !== 0}>
                          <Box sx={{ width: "100%" }}>
                            <Tabs
                              value={activeSeason}
                              onChange={handleActiveSeason}
                              variant="scrollable"
                              scrollButtons={true}
                              aria-label="season tabs"
                              allowScrollButtonsMobile
                            >
                              {Object.keys(fullSeasonData).map((season, index) => {
                                const episodeCount = totalEpisodes[season] || "TBD";
                                const numberOfEpisodes = seasonData[season]?.length || "0";
                                return (
                                  <Tab
                                    key={season}
                                    ref={(el) => {
                                      seasonTabRefs.current[index] = el;
                                    }}
                                    component="div"
                                    label={
                                      <div>
                                        Temporada {season}{" "}
                                        <span className={styles.availableEpisodes}>
                                          ({numberOfEpisodes} / {episodeCount} Episódios)
                                        </span>
                                      </div>
                                    }
                                    id={`season-tab-${index}`}
                                    aria-controls={`tabpanel-${index}`}
                                  />
                                );
                              })}
                            </Tabs>
                          </Box>
                    </div>

                    <div className={styles.divEpisodes} ref={seasonsListRef} role="tabpanel" hidden={rightDivTabSeries !== 0}>
                  {Object.keys(fullSeasonData).map((season, index) => (
                    <div
                      key={season}
                      role="tabpanel"
                      hidden={activeSeason !== index}
                      id={`tabpanel-${index}`}
                      aria-labelledby={`season-tab-${index}`}
                      className={`${styles.tabPanelDiv} `}
                    >
                      {activeSeason === index && (
                        <Box sx={{ p: 3 }}>
                          <div
                          className={`${styles.typographyDefault} `}>
                            <div className={styles.episodesList}>
                            {fullSeasonData[season].map((ep) => (
                                <div
                                    key={ep.id}
                                    title={ep.title.replace("Eps", "Episódio")}
                                    ref={ep.id === episode.id ? selectedEpisodeRef : null}
                                    className={`${styles.episode} ${ep.id === episode.id ? styles.activeEpisode : ""} ${!ep.isReleased ? styles.disabledEpisode : ""}`}
                                    onClick={() => {
                                        if (ep.isReleased) {
                                            if (ep.id !== episode.id) {
                                                setIsServerLoading(true);
                                                if (videoRef.current) {
                                                  videoRef.current.pause();
                                              } else if (playerRef.current) {
                                                  playerRef.current.pause();
                                              }

                                              localStorage.setItem(
                                                `lastPickedEpisodeV1_${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`,
                                                JSON.stringify(ep)
                                            );
                                            
                                            if (user) {
                                              const userData = fetchUserData();
                                              const currentLastPicked = userData.userLastPickedEpisode || {};
                                              setDoc(doc(db, "users", user.uid), {
                                                userLastPickedEpisode: {
                                                  ...currentLastPicked,
                                                  [`${movieDetails.title.replace(/[.~*\/\[\]]/g, '')}_${movieDetails.releaseDate}`]: ep
                                                }
                                              }, { merge: true })
                                                .then(() => {
                                                  console.log("Saved lastPickedEpisode to Firestore successfully from tabs!");
                                                  // Set Firestore changed flag since we modified the database
                                                  localStorage.setItem('wasFirestoreDatabasedChanged', JSON.stringify({value: true, timestamp: new Date().getTime()}));
                                                })
                                                .catch((error) => {
                                                  console.error("Error saving to Firestore:", error.message);
                                                });
                                            }
                                            }
                                            setEpisode(ep);
                                            // updateUrlParams(ep.season, ep.number);
                                        }
                                    }}
                                >
                                    <img
                                        className={`${ep.id === episode.id ? styles.activeEpisodeimg : styles.episodeimg}`}
                                        style={{ display: thumbnailStyle, opacity: 0, transition: "opacity 0.2s ease-in" }} 
                                        src={`${API_ENDPOINTS.TMDB_IMG_URL}w185${ep.still_path}`}
                                        loading="lazy"
                                        decoding="async"
                                        onLoad={({ currentTarget }) => {
                                          currentTarget.style.opacity = "1";}}
                                        onError={({ currentTarget }) => {
                                            currentTarget.onerror = null;
                                            currentTarget.src = "/backupback.jpg";
                                        }}
                                    />
                                        {ep.isReleased && ep.id === episode.id && (
                                          <button
                                            className={styles.episodeDownload}
                                            title="Opções de Download"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDownloadClick();
                                            }}
                                          >
                                            <FiDownload size={16} />
                                          </button>
                                        )}
                                    <span>
                                        <div>{`Episódio ${ep.number}`}</div>
                                        <p>
                                          {`${ep.air_date ? formatDate(ep.air_date) : "TBD"}`}
                                          {!ep.isReleased && ep.air_date && (() => {
                                              const dateParts = ep.air_date.split('-');
                                              const invertedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                                              const currentDate = new Date();
                                              const targetDate = new Date(ep.air_date);
                                              const timeDiff = targetDate.getTime() - currentDate.getTime();
                                              const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                              const remainingText = daysRemaining === -1 ? 'Ontem' : 
                                                                    daysRemaining === 0 ? 'Hoje' : 
                                                                    daysRemaining === 1 ? `Amanhã` : 
                                                                    `Em ${daysRemaining} dias`;
                                              return ` (${remainingText})`;
                                          })()}
                                      </p>
                                        <p style={{ display: thumbnailStyle }} >{ep.title}</p>
                                    </span>
                                </div>
))}
                            </div>
                          </div>
                        </Box>
                      )}
                    </div>
                  ))}
                    </div>

                    <div
                      className={`${styles.rightDivTabPanel} ${rightDivTabSeries === 1 ? styles.rightDivTabPanelActive : styles.rightDivTabPanelInactive}`}
                      role="tabpanel"
                      hidden={rightDivTabSeries !== 1}
                    >
                      {rightDivTabSeries === 1 && (
                        <>
                          <div className={`${styles.serversDivMovies} ${styles.serversDivMovies4}`} ref={serversListRef}>
                            {renderRightDivServerButtons()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                      {/* <>{nextAirDate}</> */}
    
                  </div>
                ) : (
                  ""
                )}
    

    
              </div>
            )
          }






          <div className={styles.infoAndSeasons}>
          {isSkeletonLoading ? (
              // Skeleton loading state
              <div className={styles.detailsCard}>
                <div className={styles.detailsCard1}>
                  <div className="posteretrailer">
                    <Skeleton 
                      variant="rectangular" 
                      animation="wave"
                      sx={{ bgcolor: 'grey.900' }}
                      className={styles.movieImageSkeleton}
                    />
                  </div>
                  <div className={styles.otherDetails1}>
                    <Skeleton 
                      variant="rectangular" 
                      animation="wave"
                      sx={{ bgcolor: 'grey.900'}}
                      className={styles.movieTitleSkeleton}
                    />
                    <Skeleton 
                      variant="rectangular" 
                      animation="wave"
                      sx={{ bgcolor: 'grey.900'}}
                      className={styles.portugueseTitleSkeleton}
                    />
                    <div className={styles.ratingAndDuration}>
                      {[...Array(5)].map((_, index) => (
                        <Skeleton 
                          key={index}
                          variant="rectangular" 
                          animation="wave"
                          sx={{ bgcolor: 'grey.900', display: 'inline-block' }}
                          className={styles.durationSkeleton}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.otherDetails}>
                  <Skeleton 
                    variant="rectangular" 
                    animation="wave"
                    sx={{ bgcolor: 'grey.900' }}
                    className={styles.overviewSkeleton}
                  />
                  <div className={styles.genres}>
                    {[...Array(4)].map((_, index) => (
                      <Skeleton 
                        key={index}
                        variant="rectangular" 
                        width={80} 
                        height={32}
                        animation="wave"
                        sx={{ bgcolor: 'grey.900', display: 'inline-block' }}
                        className={styles.genreSkeleton}
                      />
                    ))}
                  </div>
                  <div className={styles.castandcrew}>
                    <div className={styles.cast}>
                      {[...Array(windowWidth <= 550 ? 3 : 5)].map((_, index) => (
                        <Skeleton 
                          key={index}
                          variant="rectangular" 
                          animation="wave"
                          sx={{ bgcolor: 'grey.900', display: 'inline-block' }}
                          className={styles.castSkeleton}
                        />
                      ))}
                    </div>
                    <div className={styles.cast}>
                      {[...Array(3)].map((_, index) => (
                        <Skeleton 
                          key={index}
                          variant="rectangular" 
                          animation="wave"
                          sx={{ bgcolor: 'grey.900', display: 'inline-block' }}
                          className={styles.castSkeleton}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (

            <div className={styles.detailsCard}>
              {staffPermissions.hasCopyToClipboard && (
                <button
                onClick={copyToClipboard}
                className={styles.copybutton}
              >
                <FaRegCopy size={20}/>
              </button>
              )}
            <img
                src={backdropImage || "/backupback.jpg"} // Use backdropImage state as the source
                className={styles.movieImage1}
                alt={movieDetails.title}
                onLoad={({ currentTarget }) => {
                  currentTarget.style.opacity = "0.15";}}
                style={{ opacity: 0, transition: "opacity 0.2s ease-in" }}
              />
            <div className={styles.detailsCard1}>
              <div className="posteretrailer">
              <div className={styles.typeIcon}>
                  {movieDetails.type === "Movie" ? (
                    <TbMovie size={20} />
                    ) : (
                      <PiTelevisionSimpleBold size={20} />
                    )}
                    </div>

                <img
                  src={movieDetails.image || `${API_ENDPOINTS.TMDB_IMG_URL}w185` + poster}
                  className={styles.movieImage}
                  alt={movieDetails.title}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = "/backupmoviecard.png";
                  }}
                />

  </div>



                <div className={styles.otherDetails1}>
                  {pngLogo !== null ? (
                    <img className={styles.pngLogo} src={pngLogo} alt={movieDetails.title} />
                    ) : (
                      <div className={styles.movieTitle}>{movieDetails.title}</div>
                    )}

                  {portugueseTitle !== movieDetails.title && (
                  <p className={styles.portugueseTitle}>🇵🇹 {portugueseTitle}</p>
                  )}


                  <div className={styles.ratingAndDuration}>
                    <a className={styles.rating} href={imdb === 'https://www.imdb.com/title/null/' ? `https://www.imdb.com/find?q=${encodeURIComponent(movieDetails.title)}&s=tt` : imdb} target="_blank" rel="noreferrer">
                      <AiOutlineStar size={20} />
                      {tmdbRating || movieDetails.rating}
                    </a>

                    <div className={styles.duration} title={formatDate(movieDetails.releaseDate)}>
                      <MdDateRange size={20} />


                      {movieDetails.type === "TV Series" && (movieDetails.last_episode_to_air && movieDetails.last_episode_to_air.air_date) && movieDetails.status !== "Returning Series" && (movieDetails.last_episode_to_air.air_date.substring(0, 4) !== (movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : "N/A")) ? (
                        <>
                        {`${movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : "N/A"}-${movieDetails.last_episode_to_air.air_date.substring(0, 4) || "N/A"}`}
                        </>
                      ) : (
                        movieDetails.releaseDate ? movieDetails.releaseDate.substring(0, 4) : "N/A"
                      )}

                    </div>

                    {movieDetails.type === "Movie" ? (
                    <div className={styles.duration}>
                    <BiTime size={20} />
                    {extractDuration(movieDetails.duration)}
                    </div>
                    ) : (
                      ""
                    )}

                    <div className={styles.originallang}>
                      <MdOutlineLanguage size={20} />
                      {originalLang || "N/A"}
                    </div>

                    {movieDetails.type === "TV Series" ? (
                    <>
                      <div className={styles.duration}>
                      <RiSlideshow3Line size={20} />
                        {network || "N/A"}
                      </div>
                      <div className={`${styles.duration} ${styles.status}`} style={{
                        backgroundColor:
                        status === 'Concluída' ? '#FFD580' :
                        status === 'Cancelada' ? '#FF5858' :
                        undefined,
                        color: (status === 'Concluída' || status === 'Cancelada') ? 'var(--darkBlack)!important' : undefined
                      }}>
                      <HiOutlineStatusOnline size={20} />
                        {status || "N/A"}
                        </div>
                    </>
                    ) : (
                      ""
                    )}

            {movieDetails.type === "Movie" ? (
                    <div className={styles.ratingAndDuration}>
                      <div className={styles.duration}>
                      <RiInformationLine size={20}/>
                        {certificationUS || "TBD"}                        
                      </div>
                    </div>
                    ) : (
                      ""
                    )}

        {isAwards && movieDetails.type === "Movie" && (
            <CustomWidthTooltip2 
                  title={               
                  <div className={styles.awardsMainDiv}>
                    {awards.map((award, index) => (
                      <div key={index}>
                        <div className={styles.awardsCategory}>
                        &#8226; {award.category}{' '}
                          {award.winners.indexOf(movieDetails.title) === -1 &&
                            award.winners.length > 0 && (
                              <span className={styles.awardsInfo}>({award.winners.join(', ')})</span>
                            )}
                          {award.info.indexOf(movieDetails.title) === -1 &&
                            award.info.length > 0 && (
                              <span className={styles.awardsInfo}>({award.info.join(', ')})</span>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>}
                  placement="bottom" 
                  arrow disableInteractive>
                                  <a className={styles.awards} href={imdbAwards || `https://www.imdb.com/find?q=${encodeURIComponent(movieDetails.title)}`} target="_blank" rel="noreferrer">
                                        <RiAwardLine size={20} />
                                        {awards.length + " Óscar" + (awards.length === 1 ? "" : "es")}
                                  </a>
                </CustomWidthTooltip2>
                      )}

                  </div>
                </div>
              </div>

              <div className={styles.otherDetails}>
              {/* <div className={styles.cardDivider}></div> */}
              <div className={styles.releaseDate}>
                <p className={styles.labelCards}><MdMessage  size={14} />Sinopse</p>
                {hasNonEmptyContent(portugueseDesc) || hasNonEmptyContent(movieDetails.description) ? (
                  portugueseDesc || movieDetails.description
                ) : (
                  "N/A"
                )}
              </div>


              <div className={styles.cardDivider}></div>

              <div className={styles.genresDiv}>
              <p className={styles.labelCards}><BiCategoryAlt size={14}/>Géneros</p>
              <div className={styles.genres}>
                  {movieDetails.genres
                    ? movieDetails.genres.map((genre) => {
                        // Find the corresponding genre ID
                        const genreData = movieDetails.genres_ids.find((g) => g.name === genre);
                        const genreId = genreData ? genreData.id : "all";

                        // Determine the correct path based on type
                        const basePath =
                          movieDetails.type === "Movie"
                            ? `/movies/all/${genreId}/all/all/popularity.desc/1`
                            : `/tv-shows/all/${genreId}/all/all/popularity.desc/1`;

                        return (
                          <Link to={basePath} className={styles.tag} key={genreId}>
                            {translateGenre(genre)}
                          </Link>
                        );
                      })
                    : ""}
                </div>
                </div>

                <div className={styles.cardDivider}></div>
                <div className={styles.castandcrewDiv}>
                <div className={styles.castandcrew}>
                  {castInfo && castInfo.length > 0 && (
                    <div>
                    <p className={styles.labelCards}><IoIosPerson  size={14} />Elenco</p>
                    <div className={styles.cast}>
                        {castInfo.length > 5 && windowWidth >= 1025 ? (
                          <>
                          {castInfo.slice(0, 4).map((actor) => (
                            <Link to={`/person?id=${actor.actorId}`} className={styles.actor} key={actor.actorId}>
                            {/* <a className={styles.actor} href={actor.imdbId ? `https://www.imdb.com/name/${actor.imdbId}` : `https://www.imdb.com/find?q=${actor.name}&s=nm`} target="_blank" rel="noreferrer" key={actor.name} /> */}
                              <img className={styles.actorimg} src={actor.profilePath} alt={`${actor.name} Profile`} />
                              <div className={styles.actorname} title={actor.name}>{actor.name}</div>
                              <div className={styles.actorcharacter} title={actor.character}>{actor.character || 'N/A'}</div>
                            </Link>
                          ))}
                          {/* {windowWidth >= 1025 && ( */}
                            <div 
                              className={styles.viewAllCastButton}
                              onClick={() => setIsCastModalOpen(true)}
                            >
                              <p>+</p>
                              {castInfo.length - 4} {castInfo.length - 4 === 1 ? "Ator/Atriz" : "Atores/Atrizes"}
                            </div>
                          {/* )} */}
                          </>
                        ) : (
                          <>
                          {castInfo.slice(0, 5).map((actor) => (
                            <Link to={`/person?id=${actor.actorId}`} className={styles.actor} key={actor.actorId}>
                            {/* <a className={styles.actor} href={actor.imdbId ? `https://www.imdb.com/name/${actor.imdbId}` : `https://www.imdb.com/find?q=${actor.name}&s=nm`} target="_blank" rel="noreferrer" key={actor.name} /> */}
                              <img className={styles.actorimg} src={actor.profilePath} alt={`${actor.name} Profile`} />
                              <div className={styles.actorname} title={actor.name}>{actor.name}</div>
                              <div className={styles.actorcharacter} title={actor.character}>{actor.character || 'N/A'}</div>
                            </Link>
                          ))}
                          </>
                        )} 
                      </div>
                    </div>   
                  )}


                {crewInfo && crewInfo.length > 0 && (
                    <div>
                    <p className={styles.labelCards}><BiSolidCameraMovie size={14} />Equipa Técnica</p>
                    <div className={styles.crew}>
                      {crewInfo.map((producer) => (
                        <Link to={`/person?id=${producer.crewId}`} className={styles.actor} key={producer.crewId}>
                          {/* <a className={styles.actor} href={`https://www.imdb.com/find?q=${producer.name}&s=nm`} target="_blank" rel="noreferrer" key={producer.name}> */}
                          <img className={styles.actorimg} src={producer.profilePath} alt={`${producer.name} Profile`} />
                          <div className={styles.actorname} title={producer.name}>{producer.name}</div>
                          <div className={styles.actorcharacter} title={producer.jobs}>{producer.jobs}</div>
                        </Link>
                      ))}
                    </div>
                    </div>
                  )}
                </div>
                </div>


                  {keywords && keywords.length > 0 && (
                    <div className={styles.keywords}>
                      <div className={styles.keywordslist}>
                      {keywords.map((keyword, index) => {
                          // Special routing for anime keywords
                          const isAnime = keyword.name.toLowerCase() === 'anime' || keyword.name.toLowerCase() === 'animes';
                          const linkTo = isAnime 
                            ? '/animes/all/all/tv/all/popularity.desc/1'
                            : `/search/${keyword.id}-${movieDetails.originalType}-${encodeURIComponent(keyword.name)}`;

                          return (
                            <Link className={styles.keyword} key={keyword.id} to={linkTo}>
                              #{keyword.name}
                            </Link>
                          );
                        })}
                        </div>
                      </div>
                  )}
              </div>
            </div>
            )}
            
          </div>



{showResults0 && (numMoviesSaga > 1 || numMovies >= 1 || numShows >= 1 || numMovies3 > 1 || numShows3 >= 1) && (
  <Box sx={{ width: '80%'}}>
    <TabContext value={value}>
      <Box sx={{ borderBottom: 1, borderColor: 'transparent', position: 'absolute', zIndex: '1', width: '90%'}}>
        <TabList onChange={handleChange} variant="scrollable" allowScrollButtonsMobile>
        {showResults && numMoviesSaga > 1 && (
          <Tab label={
            <h2 className={styles1.headingtab}><VscLibrary size={25}/>Saga <div>{`${collectionTitle}`}</div></h2>
          } value="1" />
        )}
        {showResults2 && (
          <Tab label={
            <h2 className={styles1.headingtab}><VscFolderLibrary size={25} />Universo <div>{`${collectionTitle2}`}</div></h2>
          } value="2" />
        )}
          {showResults3 && (numMovies3 > 0 || numShows3 > 0) && (
          <Tab label={
            <h2 className={styles1.headingtab}><LuLibrary size={25} />Recomendações <div>{`O que ver a seguir?`}</div></h2>
          } value="3" />
        )}
        </TabList>
      </Box>
      {showResults && numMoviesSaga > 1 && (
      <TabPanel value="1">
  <div className={styles1.sliderContainertab}>
    <img
      src={backdropImageCollection}
      className={styles1.backdropimg}
      alt={movieDetails.title}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null;
        currentTarget.src = "/backupback.jpg"; // Use backdropImage state as the source
      }}
    />
    <div className={styles1.sliderContainerinsidetab}>
      <div className={styles1.checkboxContainer}>
        <label className={showFilmes ? styles1.outlinedLabel : ''}>
        <TbMovie size={18}/>{numMoviesSaga} Filmes
          <Radio
      checked={showFilmes}
      onChange={() => setShowFilmes(true)}
      value="filmes"
      name="radio-buttons"
      inputProps={{ 'aria-label': 'A' }}
    />
        </label>
      </div>
      <div className={styles1.slider} ref={movieCardListRef}>
        <div className={styles1.slides}>
          <div className={styles1.results}>
            {movieResults.map((result, index) => {
              const isSameTitle = result.id === movieDetails.id;
              // Filter based on the showFilmes state
              if (showFilmes && result.type === "Movie") {
                return (
                  <Link to={`/watch?id=${result.cleanId}`} key={result.id} ref={isSameTitle ? selectedMovieCardRef : null}>
                    <MovieCard
                      title={result.title}
                      type={result.type}
                      image={`${API_ENDPOINTS.TMDB_IMG_URL}w185` + result.image}
                      quality={result.quality}
                      releaseDate={result.releaseDate.substring(0, 4)}
                      media_type={result.media_type}
                      overview={result.overview}
                      vote_average={result.vote_average}
                      id={result.id}
                      isSelected={isSameTitle}
                    />
                  </Link>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
      {isOverflowing && (
            <div className={`${stylesSlider.buttonContainer} ${styles1.sliderButtonContainer}`}>
              <button onClick={scrollLeft} className={stylesSlider.buttonSlider}><BsFillCaretLeftFill size={15}/></button>
              <button onClick={scrollRight} className={stylesSlider.buttonSlider}><BsFillCaretRightFill size={15}/></button>
            </div>
          )}
    </div>
  </div>
  </TabPanel>
        )}

      
      {showResults2 && (
        <TabPanel value="2">
  <div className={styles1.sliderContainertab}>
    <img
      src={backdropImageCollection2}
      className={styles1.backdropimg}
      alt={movieDetails.title}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null;
        currentTarget.src = "/backupback.jpg"; // Use backdropImage state as the source
      }}
    />
    <div className={styles1.sliderContainerinsidetab}>
       <div className={styles1.checkboxContainer}>
{numMovies > 0 && (
  <label className={showMovies ? styles1.outlinedLabel : ''}>
    <TbMovie size={18} />
    {numMovies} Filmes
    <Checkbox
      checked={showMovies}
      onChange={(e) => setShowMovies(e.target.checked)}
      inputProps={{ 'aria-label': 'controlled' }}
    />
  </label>
)}

{numShows > 0 && (
  <label className={showSeries ? styles1.outlinedLabel : ''}>
    <PiTelevisionSimpleBold size={18} />
    {numShows} Séries
    <Checkbox
      checked={showSeries}
      onChange={(e) => setShowSeries(e.target.checked)}
      inputProps={{ 'aria-label': 'controlled' }}
    />
  </label>
)}

{numShorts > 0 && (
  <label className={showShorts ? styles1.outlinedLabel : ''}>
    <MdSlideshow size={18} />
    {numShorts} Curtas
    <Checkbox
      checked={showShorts}
      onChange={(e) => setShowShorts(e.target.checked)}
      inputProps={{ 'aria-label': 'controlled' }}
    />
  </label>
)}
</div>
      <div className={styles1.slider} ref={movieCardListRef}>
        <div className={styles1.slides}>
          <div className={styles1.results}>
            {movieResults2.map((result, index) => {
              const isSameTitle = result.id === movieDetails.id;

              // Filter based on checkbox values
              if ((showMovies && result.type === "Movie" && result.type2 !== "Short") ||
                  (showSeries && result.type === "TV Series"  && result.type2 !== "Short") ||
                  (showShorts && result.type2 === "Short")) {
                return (
                  <Link to={`/watch?id=${result.cleanId}`} key={result.id} ref={isSameTitle ? selectedMovieCardRef : null}>
                    <MovieCard
                      title={result.title}
                      type={result.type}
                      image={`${API_ENDPOINTS.TMDB_IMG_URL}w185` + result.image}
                      quality={result.quality}
                      releaseDate={result.releaseDate.substring(0, 4)}
                      media_type={result.media_type}
                      overview={result.overview}
                      vote_average={result.vote_average}
                      id={result.id}
                      isSelected={isSameTitle}
                    />
                  </Link>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
      {isOverflowing && (
            <div className={`${stylesSlider.buttonContainer} ${styles1.sliderButtonContainer}`}>
              <button onClick={scrollLeft} className={stylesSlider.buttonSlider}><BsFillCaretLeftFill size={15}/></button>
              <button onClick={scrollRight} className={stylesSlider.buttonSlider}><BsFillCaretRightFill size={15}/></button>
            </div>
          )}
    </div>
  </div>
  </TabPanel>
        )}
      

      {showResults3 && (
        <TabPanel value="3">
  <div className={styles1.sliderContainertab}>
    <img
      src="/backupback.jpg"
      className={styles1.backdropimg2}
      alt={movieDetails.title}
    />
    <div className={styles1.sliderContainerinsidetab}>
       <div className={styles1.checkboxContainer}>
{numMovies3 > 0 && (

          <label className={showMovies3 ? styles1.outlinedLabel : ''}>
                <TbMovie size={18}/>{numMovies3} Filmes
                  <Radio
              checked={showMovies3}
              onChange={(e) => setShowMovies3(e.target.checked)}
              value="filmes"
              name="radio-buttons"
              inputProps={{ 'aria-label': 'A' }}
            />
          </label>
)}

{numShows3 > 0 && (
            <label className={showSeries3 ? styles1.outlinedLabel : ''}>
                  <PiTelevisionSimpleBold size={18}/>{numShows3} Séries
                    <Radio
                checked={showSeries3}
                onChange={(e) => setShowSeries3(e.target.checked)}
                value="séries"
                name="radio-buttons"
                inputProps={{ 'aria-label': 'A' }}
              />
            </label>
)}

</div>
      <div className={styles1.slider} ref={movieCardListRef}>
        <div className={styles1.slides}>
          <div className={styles1.results}>
            {movieResults3.map((result, index) => {
              const isSameTitle = result.id === movieDetails.id;

              // Filter based on checkbox values
              if ((showMovies3 && result.type === "Movie") ||
                  (showSeries3 && result.type === "TV Series")) {
                return (
                  <Link to={`/watch?id=${result.cleanId}`} key={result.id}>
                    <MovieCard
                      title={result.title}
                      type={result.type}
                      image={`${API_ENDPOINTS.TMDB_IMG_URL}w185` + result.image}
                      quality={result.quality}
                      releaseDate={result.releaseDate.substring(0, 4)}
                      media_type={result.media_type}
                      overview={result.overview}
                      vote_average={result.vote_average}
                      id={result.id}
                      isSelected={isSameTitle}
                    />
                  </Link>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
      {isOverflowing && (
            <div className={`${stylesSlider.buttonContainer} ${styles1.sliderButtonContainer}`}>
              <button onClick={scrollLeft} className={stylesSlider.buttonSlider}><BsFillCaretLeftFill size={15}/></button>
              <button onClick={scrollRight} className={stylesSlider.buttonSlider}><BsFillCaretRightFill size={15}/></button>
            </div>
          )}
    </div>
  </div>
  </TabPanel>
        )} 


    </TabContext>
  </Box>
)}


            <div className={styles.commentBox}>
            {user ? (
              <>
              <div className={styles.commentRulesBox}>
              <img
                src={"/meteorobg.jpg"}
                className={styles.backdropimgcomments}
                alt={"backdropimgcomments"}
              />
                <div className={styles.commentRulesBoxHeader}><BiCommentError size={20}/>Regras para utilizar os comentários:</div>
              <ul>
                <li>Sê respeitoso e educado com os outros utilizadores;</li>
                <li>Mantém os comentários relevantes para o tópico em discussão;</li>
                <li>Certifica-te de selecionar a opção "Isto é Spoiler?" sempre que comentares detalhes da história de um filme ou série;</li>
                <li>Não faças spam ou publiques anúncios não solicitados;</li>
                <li>Não partilhes informações pessoais ou confidenciais;</li>
                <li>Estás à vontade para comentar problemas/bugs encontrados no Streamamos.</li>
              </ul>
              <div className={styles.commentRulesBoxDiv}>Qualquer comentário que não respeite estas regras será removido/alterado sem aviso prévio. Obrigado.</div>
              </div>
          {buttonClicked ? (
                          <Comments 
                          movieId={query.get("id")} 
                          movieTitle={movieDetails.title}
                        />
          ) : (
            <button className="butao" onClick={handleButtonClick}>
              <FaRegComments size={18} /><p className="loadcomments">Carregar Comentários</p>
            </button>
          )}
              </>
              ) : (
                <div className={styles.noAccountComments}>⚠ Secção "Comentários" disponível apenas para utilizadores registados</div>
              )} 
            </div>
        </>
      )}
    </div>
    <Modal
  open={openDownloadModal}
  //onClose={handleCloseDownloadModal}
  aria-labelledby="download-modal-title"
  aria-describedby="download-modal-description"
  sx={{
    '& > div:first-child': { 
      backgroundColor: '#292929e6!important'
    }
  }}
>
  <Box className={styles.boxDownload} sx={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '1000px',
    height: '80vh',
    bgcolor: 'var(--darkBlack)',
    boxShadow: '-10px -10px 0px 0px var(--black)',
    padding: '12px',
    borderRadius: 2,
    overflow: 'auto'
  }}>
     <a onClick={handleCloseDownloadModal} title="Close" className="modal-close">X</a>

    {!downloadModeChoice ? (
      <>
        <Typography id="download-modal-title" variant="h6" component="h2" sx={{ color: '#fff', mt: 3, textAlign: 'center' }}>
          Escolhe um tipo de download:
        </Typography>
        <Typography id="download-modal-subtitle" component="h6" sx={{ color: 'var(--grey)', mt: 0, textAlign: 'center' }}>
          {movieDetails.title}{movieDetails?.type === "TV Series" && episode ? ` - T${episode.season}E${episode.number}` : ""}
        </Typography>
      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch', mt: 4, height: '80%' }}>
        <button
          type="button"
          onClick={() => handleDownloadModeSelect('torrent')}
          className={styles.downloadButton}
          style={{
            flex: '1 1 280px',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px',
            fontSize: '1.1rem',
            fontWeight: 600,
            outline: '2px solid var(--black)',
            borderRadius: '8px',
            height: '95%'
          }}
          title="Download via Torrent"
        >
          <FaMagnet size={36} style={{ color: 'var(--orange)' }} />
          Download via Torrent
          <p style={{ color: '#999', fontSize: '12px', textAlign: 'center', marginTop: '24px', lineHeight: 1.5, fontWeight: 'normal' }}>
            • Alta velocidade com muitos seeders<br />
            • Mais estável e resistente<br />
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleDownloadModeSelect('direct')}
          className={styles.downloadButton}
          style={{
            flex: '1 1 280px',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px',
            fontSize: '1.1rem',
            fontWeight: 600,
            outline: '2px solid var(--black)',
            borderRadius: '8px',
            height: '95%'
          }}
          title="Download via Navegador"
        >
          <FaFileDownload size={36} style={{ color: 'var(--orange)' }} />
          Download via Navegador

          <p style={{ color: '#999', fontSize: '12px', textAlign: 'center', marginTop: '24px', lineHeight: 1.5, fontWeight: 'normal' }}>
            • Começa logo no browser<br />
            • Sem instalar nada extra<br />
          </p>
        </button>
      </Box>
      </>
    ) : (
      <>
        <button
          type="button"
          onClick={handleDownloadModalBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--grey)',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          title="Voltar"
        >
          <IoArrowBack size={18} /> Voltar
        </button>
        {downloadModeChoice === 'torrent' && (
          <>
            <Typography id="download-modal-title" variant="h6" component="h2" sx={{ color: '#fff', mb: 2 }}>
              Download via torrent:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#999', ml: 1, mb: 1 }}>
              <b>Nota</b>: É necessário um cliente torrent para transferir os ficheiros. Recomendamos o <a href="https://webtorrent.io/desktop/" target="_blank" rel="noreferrer" style={{fontWeight: 'bold', color: 'var(--grey)', textDecoration: 'underline'}}>WebTorrent</a> + <a href="https://www.videolan.org/vlc/" target="_blank" rel="noreferrer" style={{fontWeight: 'bold', color: 'var(--grey)', textDecoration: 'underline'}}>VLC Media Player</a> (apenas para PC/Mac), pois permite visualizar o conteúdo durante a transferência.
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#999', ml: 1 }}>
              {`*Grupo: Existe uma grande probablidade de incluir ${movieDetails.type === "TV Series" ? "a temporada completa" : "uma coleção de filmes"}`}.
            </Typography>
          </>
        )}
        {downloadModeChoice === 'direct' && (
          <>
          <Typography id="download-modal-title" variant="h6" component="h2" sx={{ color: '#fff', mb: 2 }}>
            Download via Navegador:
          </Typography>

          <Typography variant="caption" sx={{ display: 'block', color: '#999', ml: 1, mb: 1 }}>
            <b>Nota</b>: A transferência é feita diretamente pelo teu navegador/browser. 
            Recomendamos usar as versões mais recentes do <b>Google Chrome</b>, <b>Firefox</b> ou <b>Edge</b>. 
            Após a transferência, podes abrir e visualizar os ficheiros normalmente com o teu player de escolha ou o <a href="https://www.videolan.org/vlc/" target="_blank" rel="noreferrer" style={{fontWeight: 'bold', color: 'var(--grey)', textDecoration: 'underline'}}>VLC Media Player</a> (recomendado).
          </Typography>
          </>
        )}

    {isDownloadLoading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
        <CircularProgress sx={{color: "var(--orange)!important"}} />
      </Box>
    ) : downloadModeChoice === 'direct' && downloadData && downloadData.sources && downloadData.sources.downloads && downloadData.sources.downloads.length > 0 ? (
      <TableContainer component={Paper} sx={{
        bgcolor: 'transparent',
        color: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'none',
      }}>
        <Table sx={{
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'separate',
          borderSpacing: '0 8px'
        }} aria-label="direct download options table">
          <TableHead sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            bgcolor: 'var(--darkBlack)',
            marginBottom: '8px'
          }}>
            <TableRow sx={{
              '& th': {
                color: 'var(--grey)',
                fontWeight: 'bold',
                padding: '8px',
                border: 'none',
                textAlign: 'center',
                fontSize: '14px'
              }
            }}>
              <TableCell width="10%" sx={{border: 'none'}}>
                <TableSortLabel
                  active={directSortBy === 'quality'}
                  direction={directSortBy === 'quality' ? directSortDirection : 'asc'}
                  onClick={() => handleDirectSort('quality')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: 'var(--grey) !important',
                      opacity: directSortBy === 'quality' ? 1 : '0.1!important',
                      transition: 'none'
                    },
                    '&:hover .MuiTableSortLabel-icon': {
                      opacity: '0.5 !important'
                    },
                    color: 'var(--grey) !important',
                    transition: 'none'
                  }}
                  IconComponent={props => <ArrowDropDown {...props} style={{opacity: 1, visibility: 'visible'}} />}
                >
                  Qualidade
                </TableSortLabel>
              </TableCell>
              <TableCell width="54%" sx={{border: 'none'}}>Ficheiro</TableCell>
              <TableCell width="8%" sx={{border: 'none', textAlign: 'center'}}>Extensão</TableCell>
              <TableCell width="12%" sx={{border: 'none'}}>
                <TableSortLabel
                  active={directSortBy === 'size'}
                  direction={directSortBy === 'size' ? directSortDirection : 'asc'}
                  onClick={() => handleDirectSort('size')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: 'var(--grey) !important',
                      opacity: directSortBy === 'size' ? 1 : '0.1!important',
                      transition: 'none'
                    },
                    '&:hover .MuiTableSortLabel-icon': {
                      opacity: '0.5 !important'
                    },
                    color: 'var(--grey) !important',
                    transition: 'none'
                  }}
                  IconComponent={props => <ArrowDropDown {...props} style={{opacity: 1, visibility: 'visible'}} />}
                >
                  Tamanho
                </TableSortLabel>
              </TableCell>
              <TableCell width="8%" sx={{border: 'none', textAlign: 'center'}}>Download</TableCell>
              <TableCell width="8%" sx={{border: 'none', textAlign: 'center'}}>Legendas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getSortedDirectDownloads().map((item, index) => (
              <TableRow
                key={index}
                sx={{
                  '& td:nth-of-type(odd)': { bgcolor: 'var(--black)' },
                  '& td:nth-of-type(even)': { bgcolor: '#29292980' },
                  '&:hover td': { bgcolor: '#3a3a3a' },
                  height: '50px'
                }}
              >
                <TableCell sx={{
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '12px',
                  padding: '8px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  position: 'relative'
                }}>
                  {item.quality && (
                    item.quality.toLowerCase().includes('4k') ? (
                      <Md4K style={{ color: 'var(--orange)', position: 'absolute', opacity: '0.15', scale: '5', left: '18px', transform: 'rotate(320deg)' }} size={20} />
                    ) : (item.quality.toLowerCase().includes('1440p') || item.quality.toLowerCase().includes('1080p')) ? (
                      <MdHd style={{ color: 'var(--grey)', position: 'absolute', opacity: '0.15', scale: '5', left: '18px', transform: 'rotate(320deg)' }} size={20} />
                    ) : null
                  )}
                  <span title={item.quality} style={{position: 'relative', zIndex: 1}}>{item.quality || '—'}</span>
                </TableCell>
                <TableCell sx={{
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '12px',
                  padding: '8px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }} title={item.fullname || item.filename}>
                  {item.filename || item.fullname || '—'}
                </TableCell>
                <TableCell sx={{
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '12px',
                  padding: '8px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {(item.filename && item.filename.includes('.')) ? `.${item.filename.split('.').pop().toLowerCase()}` : (item.fullname && item.fullname.includes('.')) ? `.${item.fullname.split('.').pop().toLowerCase()}` : 'N/A'}
                </TableCell>
                <TableCell sx={{
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '12px',
                  padding: '8px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.size || '—'}
                </TableCell>
                <TableCell sx={{
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '12px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <a
                    href={item.link}
                    style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: 'var(--orange)', fontWeight: 600 }}
                    title="Download direto"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FiDownload size={18} />
                  </a>
                </TableCell>
                <TableCell sx={{
                  borderTopRightRadius: '8px',
                  borderBottomRightRadius: '8px',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '12px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <a
                    href={imdb ? `https://www.opensubtitles.org/pt/search/sublanguageid-por,pob/imdbid-${imdb.replace("https://www.imdb.com/title/tt", "")}` : `https://www.opensubtitles.org/pt/search/sublanguageid-por,pob/q-${encodeURIComponent(movieDetails?.title || '')}`}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    title="Download de legendas pelo OpenSubtitles.org"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <RxExternalLink size={20} style={{color: 'var(--grey)'}} />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ) : downloadModeChoice === 'torrent' && downloadData && downloadData.sources && downloadData.sources.torrents ? (
      <TableContainer component={Paper} sx={{ 
        bgcolor: 'transparent', 
        color: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'none',
      }}>
        <Table sx={{ 
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'separate',
          borderSpacing: '0 8px'
        }} aria-label="download options table">
          <TableHead sx={{
            position: 'sticky', 
            top: 0, 
            zIndex: 1, 
            bgcolor: 'var(--darkBlack)',
            marginBottom: '8px'
          }}>
            <TableRow sx={{ 
              '& th': { 
                color: 'var(--grey)', 
                fontWeight: 'bold', 
                padding: '8px',
                border: 'none',
                textAlign: 'center',
                fontSize: '14px'
              }
            }}>
              <TableCell width="10%" sx={{border: 'none'}}>
                <TableSortLabel
                  active={sortBy === 'quality'}
                  direction={sortBy === 'quality' ? sortDirection : 'asc'}
                  onClick={() => handleSort('quality')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: 'var(--grey) !important',
                      opacity: sortBy === 'quality' ? 1 : '0.1!important',
                      transition: 'none'
                    },
                    '&:hover .MuiTableSortLabel-icon': {
                      opacity: '0.5 !important'
                    },
                    color: 'var(--grey) !important',
                    transition: 'none'
                  }}
                  IconComponent={props => <ArrowDropDown {...props} style={{opacity: 1, visibility: 'visible'}} />}
                >
                  Qualidade
                </TableSortLabel>
              </TableCell>
              <TableCell width="25%" sx={{border: 'none'}}>
                Ficheiro
              </TableCell>
              <TableCell width="10%" sx={{border: 'none'}}>
                Extensão
              </TableCell>
              <TableCell width="10%" sx={{border: 'none'}}>
                <TableSortLabel
                  active={sortBy === 'size'}
                  direction={sortBy === 'size' ? sortDirection : 'asc'}
                  onClick={() => handleSort('size')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: 'var(--grey) !important',
                      opacity: sortBy === 'size' ? 1 : '0.1!important',
                      transition: 'none'
                    },
                    '&:hover .MuiTableSortLabel-icon': {
                      opacity: '0.5 !important'
                    },
                    color: 'var(--grey) !important',
                    transition: 'none'
                  }}
                  IconComponent={props => <ArrowDropDown {...props} style={{opacity: 1, visibility: 'visible'}} />}
                >
                  Tamanho
                </TableSortLabel>
              </TableCell>
              <TableCell width="10%" sx={{border: 'none'}}>
                <TableSortLabel
                  active={sortBy === 'seeds'}
                  direction={sortBy === 'seeds' ? sortDirection : 'asc'}
                  onClick={() => handleSort('seeds')}
                  sx={{
                    '& .MuiTableSortLabel-icon': {
                      color: 'var(--grey) !important',
                      opacity: sortBy === 'seeds' ? 1 : '0.1!important',
                      transition: 'none'
                    },
                    '&:hover .MuiTableSortLabel-icon': {
                      opacity: '0.5 !important'
                    },
                    color: 'var(--grey) !important',
                    transition: 'none'
                  }}
                  IconComponent={props => <ArrowDropDown {...props} style={{opacity: 1, visibility: 'visible'}} />}
                >
                  Seeds
                </TableSortLabel>
              </TableCell>
              <TableCell width="12%" sx={{border: 'none'}}>
                Fonte
              </TableCell>
              <TableCell width="7%" sx={{border: 'none'}}>
                Grupo*
              </TableCell>
              <TableCell width="8%" sx={{border: 'none', textAlign: 'center'}}>
                Magnet
              </TableCell>
              <TableCell width="8%" sx={{border: 'none', textAlign: 'center'}}>
                Legendas
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getSortedTorrents().map((torrent, index) => (
              <TableRow
                key={index}
                sx={{ 
                  '& td:nth-of-type(odd)': { bgcolor: 'var(--black)' }, 
                  '& td:nth-of-type(even)': { bgcolor: '#29292980' },
                  '&:hover td': { bgcolor: '#3a3a3a' },
                  height: '50px'
                }}
              >
                <TableCell 
                  sx={{ 
                    borderTopLeftRadius: '8px', 
                    borderBottomLeftRadius: '8px',
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: '12px',
                    padding: '8px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    position: 'relative'
                  }}
                >
                  {torrent.quality && (
                    torrent.quality.toLowerCase().includes('4k') ? (
                      <Md4K style={{ color: 'var(--orange)', position: 'absolute', opacity: '0.15', scale: '5', left: '18px', transform: 'rotate(320deg)' }} size={20} />
                    ) : (torrent.quality.toLowerCase().includes('1440p') || torrent.quality.toLowerCase().includes('1080p')) ? (
                      <MdHd style={{ color: 'var(--grey)', position: 'absolute', opacity: '0.15', scale: '5', left: '18px', transform: 'rotate(320deg)' }} size={20} />
                    ) : null
                  )}
                  <span title={torrent.quality} style={{position: 'relative', zIndex: 1}}>
                    {torrent.quality}
                  </span>
                </TableCell>
                <TableCell 
                  sx={{ 
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: '12px',
                    padding: '8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={torrent.fullname}
                >
                  {torrent.filename || torrent.fullname}
                </TableCell>
                <TableCell 
                  sx={{ 
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: '12px',
                    padding: '8px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {(torrent.filename && torrent.filename.includes('.')) ? `.${torrent.filename.split('.').pop().toLowerCase()}` : 'N/A'}
                </TableCell>
                <TableCell 
                  sx={{ 
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: '12px',
                    padding: '8px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {torrent.size}
                </TableCell>
                <TableCell 
                  sx={{ 
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: '12px',
                    padding: '8px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px'}}>{torrent.seeds}<MdPeople size={15}/></span>
                </TableCell>
                <TableCell 
                  sx={{ 
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: '12px',
                    padding: '8px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={torrent.source}
                >
                  {torrent.source}
                </TableCell>
                <TableCell 
                  sx={{ 
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: '12px',
                    padding: '8px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {torrent.isGroup ? "✓" : "x"}
                </TableCell>
                <TableCell 
                  sx={{ 
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: '12px',
                    padding: '8px',
                    textAlign: 'center'
                  }}
                >
                  <a 
                    href={torrent.magnet} 
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}
                    title="Download Magnet Link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaMagnet size={20} style={{color: 'var(--orange)'}} />
                  </a>
                </TableCell>
                <TableCell 
                  sx={{ 
                    borderTopRightRadius: '8px', 
                    borderBottomRightRadius: '8px',
                    border: 'none',
                    color: 'var(--white)',
                    fontSize: '12px',
                    padding: '8px',
                    textAlign: 'center'
                  }}
                >
                  <a 
                    href={`https://www.opensubtitles.org/pt/search/sublanguageid-por,pob/imdbid-${imdb.replace("https://www.imdb.com/title/tt", "")}`}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}
                    title="Download de legendas pelo OpenSubtitles.org"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <RxExternalLink size={20} style={{color: 'var(--grey)'}} />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ) : (
      <>
        <Typography sx={{ color: 'var(--white)', textAlign: 'center', mt: 10, mb: 2 }}>Não foram encontradas opções de download</Typography>
        <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
          <button onClick={() => handleDownloadModeSelect(downloadModeChoice)} className={`${styles.downloadButtonTryAgain} ${styles.downloadButton}`} title="Tentar novamente">
            <FaArrowRotateLeft size={18} /> Tentar Novamente
          </button>
        </div>
      </>
    )}
      </>
    )}
  </Box>
</Modal>

{/* Cast Modal */}
<Modal
  open={isCastModalOpen}
  // onClose={() => setIsCastModalOpen(false)}
  aria-labelledby="cast-modal-title"
  sx={{
    '& > div:first-child': { 
      backgroundColor: '#292929e6!important'
    }
  }}
>
  <Box className={styles.boxDownload} sx={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '1000px',
    height: '80vh',
    bgcolor: 'var(--darkBlack)',
    boxShadow: '-10px -10px 0px 0px var(--black)',
    padding: '12px',
    borderRadius: 2,
    overflow: 'auto',
    outline: '0px solid transparent'
  }}>
    <a onClick={handleCloseCastModal} title="Close" className="modal-close">X</a>
    <Typography 
      id="cast-modal-title" 
      variant="h6" 
      component="h2"
      sx={{ 
        color: 'var(--white)', 
        textAlign: 'left', 
        mb: 2
      }}
    >
      Elenco {movieDetails.type === "Movie" ? "Completo" : "Principal"} ({castInfo.length} Atores e Atrizes)
    </Typography>
    <div className={styles.castModalContent}>
      {castInfo.map((actor) => (
        <Link 
          to={`/person?id=${actor.actorId}`} 
          className={styles.actor}
          style={{ 
            backgroundColor: 'var(--black)!important' 
          }}
          key={actor.actorId}
          onClick={() => setIsCastModalOpen(false)}
        >
          <img className={styles.actorimg} src={actor.profilePath} alt={`${actor.name} Profile`} />
          <div className={styles.actorname} title={actor.name}>{actor.name}</div>
          <div className={styles.actorcharacter} title={actor.character}>{actor.character || 'N/A'}</div>
        </Link>
      ))}
    </div>
  </Box>
</Modal>
  </div>
);
}
