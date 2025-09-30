// Función para generar datos de prueba
export const generateTestData = () => {
  // Limpiar datos existentes
  localStorage.removeItem('dhirofans_posts');
  localStorage.removeItem('dhirofans_usernames');
  
  // Crear usuarios de prueba
  const testUsers = [
    {
      id: 'user1',
      username: 'maria_garcia',
      fullName: 'María García',
      email: 'maria@test.com',
      profilePicture: '',
      bio: 'Amante de la fotografía 📸'
    },
    {
      id: 'user2', 
      username: 'carlos_lopez',
      fullName: 'Carlos López',
      email: 'carlos@test.com',
      profilePicture: '',
      bio: 'Creador de contenido 🎥'
    },
    {
      id: 'user3',
      username: 'ana_martinez',
      fullName: 'Ana Martínez',
      email: 'ana@test.com',
      profilePicture: '',
      bio: 'Diseñadora gráfica ✨'
    }
  ];

  // Guardar usuarios
  testUsers.forEach(user => {
    localStorage.setItem(`dhirofans_user_${user.id}`, JSON.stringify({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      followers: Math.floor(Math.random() * 1000),
      following: Math.floor(Math.random() * 500),
      posts: 0
    }));
  });

  // Crear publicaciones de prueba
  const testPosts = [
    {
      id: 'post1',
      userId: 'user1',
      username: 'maria_garcia',
      title: 'Atardecer en la playa',
      description: 'Un hermoso atardecer que capturé ayer',
      mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      mediaType: 'image' as const,
      timestamp: Date.now() - 3600000,
      likes: 45,
      comments: 12
    },
    {
      id: 'post2',
      userId: 'user2',
      username: 'carlos_lopez',
      title: 'Mi nuevo video',
      description: 'Trabajando en mi último proyecto',
      mediaUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      mediaType: 'video' as const,
      timestamp: Date.now() - 7200000,
      likes: 78,
      comments: 23
    },
    {
      id: 'post3',
      userId: 'user3',
      username: 'ana_martinez',
      title: 'Diseño minimalista',
      description: 'Nuevo diseño para un cliente',
      mediaUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400',
      mediaType: 'image' as const,
      timestamp: Date.now() - 10800000,
      likes: 92,
      comments: 18
    },
    {
      id: 'post4',
      userId: 'user1',
      username: 'maria_garcia',
      title: 'Fotografía urbana',
      description: 'Explorando la ciudad con mi cámara',
      mediaUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      mediaType: 'image' as const,
      timestamp: Date.now() - 14400000,
      likes: 67,
      comments: 15
    }
  ];

  // Guardar publicaciones
  localStorage.setItem('dhirofans_posts', JSON.stringify(testPosts));

  // Registrar usernames
  const usernames = testUsers.map(u => u.username);
  localStorage.setItem('dhirofans_usernames', JSON.stringify(usernames));

  console.log('✅ Datos de prueba generados:');
  console.log('- 3 usuarios de prueba');
  console.log('- 4 publicaciones de prueba');
  console.log('Recarga la página para ver los cambios');
};

// Función para limpiar datos de prueba
export const clearTestData = () => {
  localStorage.removeItem('dhirofans_posts');
  localStorage.removeItem('dhirofans_usernames');
  ['user1', 'user2', 'user3'].forEach(id => {
    localStorage.removeItem(`dhirofans_user_${id}`);
  });
  console.log('🗑️ Datos de prueba eliminados');
};

// Hacer funciones disponibles globalmente para testing
if (typeof window !== 'undefined') {
  (window as any).generateTestData = generateTestData;
  (window as any).clearTestData = clearTestData;
}