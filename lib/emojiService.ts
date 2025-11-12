export interface AnimatedEmoji {
  id: string;
  name: string;
  category: 'smileys' | 'gestures' | 'animals' | 'food' | 'activities' | 'objects';
  path: string;
}

export const EMOJI_CATEGORIES = [
  { id: 'smileys', name: '😊 Caritas', icon: '😊' }
] as const;

export const ANIMATED_EMOJIS: AnimatedEmoji[] = [
  // Smileys
  { id: 'kiss', name: 'Beso', category: 'smileys', path: '/emojis/kiss.json' },
  { id: 'sonrisa', name: 'sonrisa', category: 'smileys', path: '/emojis/sonrisa.json' },
  { id: 'reir', name: 'reir', category: 'smileys', path: '/emojis/reir.json' },
  { id: 'reir 2', name: 'reir', category: 'smileys', path: '/emojis/reir 2.json' },
  { id: 'sonreir', name: 'sonreir', category: 'smileys', path: '/emojis/sonreir.json' },
  { id: 'sonreir2', name: 'sonreir', category: 'smileys', path: '/emojis/sonreir2.json' },
  { id: 'derretido', name: 'derretido', category: 'smileys', path: '/emojis/derretido.json' },
  { id: 'picar ojo', name: 'picar ojo', category: 'smileys', path: '/emojis/picar ojo.json' },
  { id: 'Bendecido', name: 'Bendecido', category: 'smileys', path: '/emojis/Bendecido.json' },
  { id: 'amor', name: 'amor', category: 'smileys', path: '/emojis/amor.json' },
  { id: 'asustado', name: 'asustado', category: 'smileys', path: '/emojis/asustado.json' },




  // Gestures
  { id: 'wave', name: 'Saludo', category: 'gestures', path: '/emojis/wave.json' },
  { id: 'thumbs-up', name: 'Me gusta', category: 'gestures', path: '/emojis/thumbs-up.json' },
  { id: 'clap', name: 'Aplauso', category: 'gestures', path: '/emojis/clap.json' },
  { id: 'fire', name: 'Fuego', category: 'gestures', path: '/emojis/fire.json' },
  
  // Animals
  { id: 'dog', name: 'Perro', category: 'animals', path: '/emojis/dog.json' },
  { id: 'cat', name: 'Gato', category: 'animals', path: '/emojis/cat.json' },
  
  // Food
  { id: 'pizza', name: 'Pizza', category: 'food', path: '/emojis/pizza.json' },
  { id: 'cake', name: 'Pastel', category: 'food', path: '/emojis/cake.json' },
  
  // Activities
  { id: 'party', name: 'Fiesta', category: 'activities', path: '/emojis/party.json' },
  { id: 'gift', name: 'Regalo', category: 'activities', path: '/emojis/gift.json' },
  
  // Objects
  { id: 'heart', name: 'Corazón', category: 'objects', path: '/emojis/heart.json' },
  { id: 'star', name: 'Estrella', category: 'objects', path: '/emojis/star.json' }
];

export const getEmojisByCategory = (category: string) => {
  return ANIMATED_EMOJIS.filter(emoji => emoji.category === category);
};

export const searchEmojis = (query: string) => {
  return ANIMATED_EMOJIS.filter(emoji => 
    emoji.name.toLowerCase().includes(query.toLowerCase())
  );
};
