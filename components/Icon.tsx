type IconName = "home" | "store" | "map" | "globe" | "poster" | "check" | "arrow" | "sparkles" | "camera" | "clock" | "phone" | "pin" | "external";

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  store: <><path d="M4 10v10h16V10"/><path d="M3 4h18l-2 6H5L3 4Z"/><path d="M8 20v-6h8v6"/></>,
  map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></>,
  poster: <><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9" cy="8" r="2"/><path d="m6 17 4-4 3 3 2-2 3 3"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m5 14 .7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14Z"/></>,
  camera: <><path d="M4 7h4l1.5-2h5L16 7h4v12H4V7Z"/><circle cx="12" cy="13" r="3"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  phone: <path d="M7 3H4v4c0 7 6 13 13 13h4v-3l-4-2-2 2c-4-1-7-4-8-8l2-2-2-4Z"/>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
  external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v7H4V6h7"/></>,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
