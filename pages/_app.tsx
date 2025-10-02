import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/comments.css';
import { CommentsProvider } from '../contexts/CommentsContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CommentsProvider>
      <Component {...pageProps} />
    </CommentsProvider>
  );
}