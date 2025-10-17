import type { AppProps } from 'next/app';
import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/reels.css';
import '../styles/publish.css';
import '../styles/camera-interface.css';
import '../styles/countdown-selector.css';
import '../styles/create-dynamic.css';
import '../styles/publish-professional.css';
import '../styles/basic-editor.css';
import '../styles/comments.css';
import '../styles/chat.css';
import '../styles/chat-conversation.css';
import '../styles/chat-responsive.css';
import '../styles/z-index-hierarchy.css';
import { CommentsProvider } from '../contexts/CommentsContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CommentsProvider>
      <Component {...pageProps} />
    </CommentsProvider>
  );
}