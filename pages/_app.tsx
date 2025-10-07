import type { AppProps } from 'next/app';
import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/reels.css';
import '../styles/publish.css';
import '../styles/comments.css';
import '../styles/z-index-hierarchy.css';
import { CommentsProvider } from '../contexts/CommentsContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CommentsProvider>
      <Component {...pageProps} />
    </CommentsProvider>
  );
}