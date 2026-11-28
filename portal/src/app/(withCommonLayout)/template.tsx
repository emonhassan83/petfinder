import { PageTransition } from "@/components/UI/Motion";

//* Re-mounts on every navigation inside the public layout, so each page fades in.
export default function CommonTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
