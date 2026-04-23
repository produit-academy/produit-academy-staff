import '../styles/globals.css';
import { StaffAuthProvider } from '../lib/auth';

export default function App({ Component, pageProps }) {
    return (
        <StaffAuthProvider>
            <Component {...pageProps} />
        </StaffAuthProvider>
    );
}
