// "Delivered" / "Read 3:14 PM" under the last sent message. Measured on an
// iOS 17 Messages screenshot (idownloadblog, 1.63 px/pt): 11pt semibold
// (ink width of "Delivered" = 51pt, matches SF Pro Text Semibold 11), #8E8E93,
// right-aligned ~1pt in from the bubble's right edge, cap top ~7.4pt below
// the bubble. "Read" is semibold, the time regular (same pattern as the
// "Today 10:00 AM" dividers).
import { SF_TEXT, tracking } from "./fonts";

export function Receipt({
  status,
  time,
  progress = 1,
}: {
  status: "delivered" | "read";
  /** e.g. "3:14 PM"; only used for "read". */
  time?: string;
  /** 0..1 fade-in. */
  progress?: number;
}) {
  return (
    <div
      style={{
        fontFamily: SF_TEXT,
        fontSize: 11,
        lineHeight: "13px",
        letterSpacing: tracking(11),
        color: "#8E8E93",
        textAlign: "right",
        paddingRight: 1,
        marginTop: 5,
        opacity: progress,
        whiteSpace: "nowrap",
      }}
    >
      {status === "delivered" ? (
        <span style={{ fontWeight: 600 }}>Delivered</span>
      ) : (
        <>
          <span style={{ fontWeight: 600 }}>Read</span>
          {time ? ` ${time}` : null}
        </>
      )}
    </div>
  );
}
