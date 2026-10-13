// iOS 26 composer, from the reference SVG: floats on the page (no strip), a 45pt
// glass + button 19pt from a borderless 45pt glass pill, 17pt medium #CCCCCC
// placeholder and dictation waveform. While typing, it becomes a blue send button.
import { glass, IOS26_BLUE, IOS26_PLACEHOLDER } from "./look";
import { EmojiText } from "./parts";
import { Waveform } from "./Waveform";

const CONTROL = 45;
const SEND = 35;
/** Home-indicator safe area under the floating composer. */
const SAFE_BOTTOM = 34;

const PLUS =
  "M289.238 684.949C289.238 684.604 289.362 684.308 289.609 684.061C289.857 683.813 290.153 683.689 290.498 683.689H296.25V677.947C296.25 677.602 296.37 677.306 296.611 677.059C296.852 676.811 297.148 676.688 297.5 676.688C297.845 676.688 298.141 676.811 298.389 677.059C298.636 677.306 298.76 677.602 298.76 677.947V683.689H304.512C304.85 683.689 305.143 683.813 305.391 684.061C305.638 684.308 305.762 684.604 305.762 684.949C305.762 685.301 305.638 685.6 305.391 685.848C305.143 686.089 304.85 686.209 304.512 686.209H298.76V691.961C298.76 692.299 298.636 692.592 298.389 692.84C298.141 693.087 297.845 693.211 297.5 693.211C297.148 693.211 296.852 693.087 296.611 692.84C296.37 692.592 296.25 692.299 296.25 691.961V686.209H290.498C290.153 686.209 289.857 686.089 289.609 685.848C289.362 685.6 289.238 685.301 289.238 684.949Z";

export function ComposerIOS26({ draft }: { draft: string }) {
  const typing = draft.length > 0;
  return (
    <div
      style={{
        flexShrink: 0,
        padding: `0 24px ${SAFE_BOTTOM}px 25px`,
        display: "flex",
        alignItems: "flex-end",
        gap: 19,
      }}
    >
      <div
        style={{
          borderRadius: CONTROL / 2,
          ...glass(),
          width: CONTROL,
          height: CONTROL,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="16.52"
          height="16.52"
          viewBox="289.238 676.688 16.52 16.52"
          style={{ display: "block" }}
          aria-hidden
        >
          <path d={PLUS} fill="#000" />
        </svg>
      </div>
      <div
        style={{
          borderRadius: CONTROL / 2,
          ...glass(),
          flex: 1,
          minHeight: CONTROL,
          display: "flex",
          alignItems: "flex-end",
          paddingLeft: 16,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: CONTROL,
            // 0.9pt lower than geometric centre puts the typed line's ink on the pill's centre.
            padding: "12.4px 0 10.6px",
            display: "flex",
            alignItems: "center",
            fontSize: 17,
            lineHeight: "22px",
            wordBreak: "break-word",
          }}
        >
          {typing ? (
            <span style={{ color: "#000", letterSpacing: "-0.02em" }}>
              <EmojiText text={draft} />
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 21,
                  marginLeft: 1,
                  verticalAlign: "-4px",
                  borderRadius: 1,
                  background: IOS26_BLUE,
                }}
              />
            </span>
          ) : (
            <span style={{ color: IOS26_PLACEHOLDER, fontWeight: 500 }}>
              iMessage
            </span>
          )}
        </div>
        {typing ? (
          <div
            style={{
              width: SEND,
              height: SEND,
              flexShrink: 0,
              margin: (CONTROL - SEND) / 2,
              marginLeft: 6,
              borderRadius: SEND / 2,
              background: IOS26_BLUE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="18" viewBox="0 0 14 16" aria-hidden>
              <path
                d="M7 14.5V2M1.5 7.5L7 2l5.5 5.5"
                stroke="#fff"
                strokeWidth="2.4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <Waveform
            color={IOS26_PLACEHOLDER}
            style={{ margin: "auto 13px auto 6px", alignSelf: "center" }}
          />
        )}
      </div>
    </div>
  );
}
