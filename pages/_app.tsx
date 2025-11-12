import type { AppProps } from 'next/app';
import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/ios-video-fix.css';
import '../styles/ios-video-force.css';
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

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('Extra attributes') || args[0].includes('data-np-intersection-state'))) return;
    originalError(...args);
  };
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CommentsProvider>
      <Component {...pageProps} />
    </CommentsProvider>
  );
}