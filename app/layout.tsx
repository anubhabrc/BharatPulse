import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'BharatPulse Geo · Repository foundation',description:'Indian startup company and funding repository development scaffold'};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
