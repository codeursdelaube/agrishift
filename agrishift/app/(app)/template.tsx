/** Rejoué à chaque navigation : fondu court, uniquement opacity/transform. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
