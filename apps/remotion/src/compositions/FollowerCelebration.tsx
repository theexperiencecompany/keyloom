import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  useVideoConfig,
} from "remotion";
import { proxyExternalImg } from "../proxy-image";
import { useDesignFrame } from "../use-design-frame";

export const FOLLOWER_DURATION = 240; // 4s @ 60fps
export const FOLLOWER_FPS = 60;
export const FOLLOWER_WIDTH = 1280;
export const FOLLOWER_HEIGHT = 720;

type Follower = { login: string; avatar_url: string };

export type FollowerProps = {
  username: string;
  userAvatarUrl: string;
  followerCount: number;
  followers: Follower[];
};

export const calculateFollowerMetadata: CalculateMetadataFunction<
  FollowerProps
> = async ({ props }) => {
  const userRes = await fetch(`https://api.github.com/users/${props.username}`);
  const user = userRes.ok ? await userRes.json() : null;

  const all: Follower[] = [];
  const pageRequests = await Promise.all(
    [1, 2, 3, 4, 5].map((page) =>
      fetch(
        `https://api.github.com/users/${props.username}/followers?per_page=100&page=${page}`,
      ).then((r) => (r.ok ? (r.json() as Promise<Follower[]>) : [])),
    ),
  );
  for (const data of pageRequests) {
    if (!data.length) break;
    all.push(...data);
  }

  return {
    props: {
      ...props,
      userAvatarUrl:
        user?.avatar_url ??
        `https://avatars.githubusercontent.com/${props.username}?s=200`,
      followerCount: user?.followers ?? props.followerCount,
      followers: all.length ? all : props.followers,
    },
  };
};

const ANIM_SECONDS = 3;
const AVATAR_SIZE = 128;
const GAP = 16;
const HEART_SIZE = 32;

export const FollowerCelebration: React.FC<FollowerProps> = ({
  username,
  userAvatarUrl,
  followerCount,
  followers,
}) => {
  return (
    <AbsoluteFill style={{ background: "#ffffff" }}>
      <Header username={username} userAvatarUrl={userAvatarUrl} />
      <FollowersRow followers={followers} />
      <Counter targetCount={followerCount} />
    </AbsoluteFill>
  );
};

function Header({
  username,
  userAvatarUrl,
}: {
  username: string;
  userAvatarUrl: string;
}) {
  return (
    <div
      style={{
        padding: 64,
        fontSize: 72,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, 'SF Pro Display', sans-serif",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: "#0f1014",
      }}
    >
      <span>
        <Img
          src={proxyExternalImg(userAvatarUrl)}
          crossOrigin="anonymous"
          alt={username}
          style={{
            display: "inline-block",
            width: "1.2em",
            height: "1.2em",
            borderRadius: "50%",
            verticalAlign: "middle",
            marginRight: "0.25em",
            marginBottom: "0.18em",
            objectFit: "cover",
          }}
        />
        @{username}
      </span>
      <span style={{ opacity: 0.3, margin: "0 0.25em" }}>·</span>
      <strong>followers</strong>
    </div>
  );
}

function FollowersRow({ followers }: { followers: Follower[] }) {
  const frame = useDesignFrame();
  const { fps, width } = useVideoConfig();
  if (!followers.length) return null;

  const cell = AVATAR_SIZE + GAP;
  const total = followers.length;

  // Single shared scroll for the whole row.
  // Slides from 0 to (total*cell - width*0.75) with elastic ease.
  const scroll = interpolate(
    frame,
    [0, ANIM_SECONDS * fps],
    [0, total * cell - width * 0.75],
    { extrapolateRight: "clamp", easing: Easing.elastic(1) },
  );

  return (
    <div style={{ position: "relative", flex: 1 }}>
      {followers.map((f, i) => {
        const x = GAP + i * cell - scroll;
        // Cull avatars outside the viewport
        if (x < -AVATAR_SIZE - 100 || x > width + 100) return null;

        // Soft fade as they enter from right and exit on left
        const enterIn = Math.min(1, (width - x) / 220);
        const enterOut = Math.min(1, (x + AVATAR_SIZE) / 220);
        const visibility = Math.max(0, Math.min(enterIn, enterOut));

        const scale = 0.85 + visibility * 0.15;
        const opacity = visibility;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: x,
              width: AVATAR_SIZE,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            <Img
              src={proxyExternalImg(f.avatar_url)}
              crossOrigin="anonymous"
              alt={f.login}
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow:
                  "0 2px 4px rgba(15,16,20,0.06), 0 14px 36px rgba(15,16,20,0.16)",
              }}
            />
            <div style={{ marginTop: 16 }}>
              <Heart size={HEART_SIZE} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Counter({ targetCount }: { targetCount: number }) {
  const frame = useDesignFrame();
  const { fps } = useVideoConfig();
  const displayed = Math.round(
    interpolate(frame, [0, ANIM_SECONDS * fps], [0, targetCount], {
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.5, 1, 0.5, 1),
    }),
  );

  return (
    <div
      style={{
        textAlign: "right",
        padding: "0 64px 64px",
        fontSize: 128,
        color: "#0f1014",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, 'SF Pro Display', sans-serif",
      }}
    >
      <strong style={{ fontVariantNumeric: "tabular-nums" }}>
        {displayed.toLocaleString("en-US")}
      </strong>
      &nbsp;followers
    </div>
  );
}

function Heart({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#fb7185"
      stroke="#e11d48"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
