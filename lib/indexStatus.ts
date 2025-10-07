// Utilidad para manejar errores de índices de Firestore
export const handleIndexError = (error: any): boolean => {
  if (error.code === 'failed-precondition' || 
      error.message?.includes('index') || 
      error.message?.includes('requires an index')) {
    console.warn('⚠️ Los índices de Firestore se están construyendo. Usando método alternativo...');
    return true;
  }
  return false;
};

export const showIndexMessage = () => {
  console.log('📋 Los índices de Firestore se están construyendo en segundo plano.');
  console.log('📋 Las publicaciones aparecerán normalmente una vez completado el proceso.');
  console.log('📋 Esto puede tomar unos minutos la primera vez.');
};