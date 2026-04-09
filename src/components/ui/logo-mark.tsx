export function LogoMark() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.2rem] border border-white/50 bg-[linear-gradient(145deg,#0b1628_0%,#102342_52%,#1098f7_100%)] shadow-card">
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11 25V7.5H17.8C22.1 7.5 24.8 10 24.8 13.7C24.8 17.6 22 20 17.7 20H14.8"
          stroke="rgba(255,255,255,0.96)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.8"
        />
        <path
          d="M13 25L22.5 15.5"
          stroke="rgba(20,200,178,0.92)"
          strokeLinecap="round"
          strokeWidth="2.8"
        />
      </svg>
      <div className="absolute inset-x-2 bottom-1 h-px bg-white/20" />
    </div>
  );
}
