import type { CompositionInfo } from "../../schema";
import type { SpotifyPlayerProps } from "./SpotifyPlayer";

export const SPOTIFY_PLAYER_DURATION = 240;
export const SPOTIFY_PLAYER_FPS = 60;
export const SPOTIFY_PLAYER_WIDTH = 1080;
export const SPOTIFY_PLAYER_HEIGHT = 1920;

export const spotifyPlayerDefaultProps: SpotifyPlayerProps = {
  albumArt:
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80",
  trackTitle: "Midnight Drive",
  artist: "Aurora Lane",
  playlist: "Late Night Coding",
  elapsedSeconds: 67,
  totalSeconds: 214,
  liked: true,
  tint: "#5b3a8c",
};

export const spotifyPlayerInfo: CompositionInfo<SpotifyPlayerProps> = {
  id: "SpotifyPlayer",
  category: "social",
  agentNotes:
    "Authentic Spotify 'Now Playing' phone screen (9:16): album art, track title, artist, animated progress scrubber that advances as it plays, and the shuffle/prev/play/next/repeat control row. Use for music drops, 'now playing' beats, playlist promos. Set `tint` to a color pulled from the album art for the signature gradient.",
  title: "Spotify Player",
  description:
    "A Spotify-style Now Playing screen with album art, a live progress bar, and playback controls. Customize the track, artist, playlist, times, and gradient tint.",
  durationInFrames: SPOTIFY_PLAYER_DURATION,
  fps: SPOTIFY_PLAYER_FPS,
  width: SPOTIFY_PLAYER_WIDTH,
  height: SPOTIFY_PLAYER_HEIGHT,
  defaultProps: spotifyPlayerDefaultProps,
  brandMode: "locked",
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
    { kind: "color", key: "tint", label: "Background tint" },
  ],
};
