import Head from 'next/head';
import '../styles/globals.css';
import { StaffAuthProvider } from '../lib/auth';

export default function App({ Component, pageProps }) {
    return (
        <StaffAuthProvider>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="robots" content="noindex, nofollow" />
                <title>Staff Portal | Produit Academy</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Component {...pageProps} />
        </StaffAuthProvider>
    );
}
