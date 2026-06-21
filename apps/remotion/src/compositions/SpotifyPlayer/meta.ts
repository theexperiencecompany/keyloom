import type { CompositionInfo } from "../../schema";
import type { SpotifyPlayerProps } from "./SpotifyPlayer";

export const SPOTIFY_PLAYER_DURATION = 480;
export const SPOTIFY_PLAYER_FPS = 60;
export const SPOTIFY_PLAYER_WIDTH = 1080;
export const SPOTIFY_PLAYER_HEIGHT = 1920;

export const spotifyPlayerDefaultProps: SpotifyPlayerProps = {
  albumArt:
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80",
  trackTitle: "Midnight Drive",
  artist: "Aurora Lane",
  playlist: "Late Night Coding",
  elapsedSeconds: 28,
  totalSeconds: 96,
  liked: true,
  explicit: true,
};

export const spotifyPlayerInfo: CompositionInfo<SpotifyPlayerProps> = {
  id: "SpotifyPlayer",
  category: "social",
  // Tint the background gradient from the album cover, like real Spotify.
  tintFromImageKey: "albumArt",
  agentNotes:
    "Spotify 'Now Playing' phone screen (9:16): album art, track title, artist, animated progress scrubber that advances as it plays, and the shuffle/prev/play/next/repeat control row. Use for music drops, 'now playing' beats, playlist promos. The Style Background sets the signature gradient tint; Accent sets the green control color.",
  title: "Spotify Player",
  description:
    "A Spotify-style Now Playing screen with album art, a live progress bar, and playback controls. Customize the track, artist, playlist, times, and colors.",
  durationInFrames: SPOTIFY_PLAYER_DURATION,
  fps: SPOTIFY_PLAYER_FPS,
  width: SPOTIFY_PLAYER_WIDTH,
  height: SPOTIFY_PLAYER_HEIGHT,
  defaultProps: spotifyPlayerDefaultProps,
  fields: [
    { kind: "image", key: "albumArt", label: "Album cover" },
    { kind: "text", key: "trackTitle", label: "Track title" },
    { kind: "text", key: "artist", label: "Artist" },
    { kind: "text", key: "playlist", label: "Playlist name" },
    {
      kind: "number",
      key: "elapsedSeconds",
      label: "Elapsed (seconds)",
      min: 0,
    },
    {
      kind: "number",
      key: "totalSeconds",
      label: "Total length (seconds)",
      min: 1,
    },
    { kind: "switch", key: "liked", label: "Liked" },
    { kind: "switch", key: "explicit", label: "Explicit" },
  ],
};
