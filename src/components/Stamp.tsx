import { useId } from "react";

export default function Stamp({
  count,
  size = 132,
  press = false,
}: {
  count: number;
  size?: number;
  press?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <span className={`stamp ${press ? "stamp-press" : ""}`}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        role="img"
        aria-label={`Verified by customers: ${count} ${count === 1 ? "job" : "jobs"}`}
      >
        <defs>
          <path id={`${id}-arc`} d="M 100,100 m -73,0 a 73,73 0 1,1 146,0 a 73,73 0 1,1 -146,0" />
          <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
          </filter>
        </defs>
        <g filter={`url(#${id}-rough)`} fill="none" stroke="currentColor">
          <circle cx="100" cy="100" r="93" strokeWidth="5" />
          <circle cx="100" cy="100" r="85" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="53" strokeWidth="1.5" />
          <text
            fill="currentColor"
            stroke="none"
            fontSize="16"
            fontWeight="700"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <textPath href={`#${id}-arc`} textLength="450" lengthAdjust="spacing">
              VERIFIED BY CUSTOMERS • KREDO •
            </textPath>
          </text>
          <text
            x="100"
            y="112"
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontSize="46"
            fontWeight="800"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {count}
          </text>
          <text
            x="100"
            y="134"
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontSize="14"
            fontWeight="600"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {count === 1 ? "job" : "jobs"}
          </text>
        </g>
      </svg>
    </span>
  );
}
