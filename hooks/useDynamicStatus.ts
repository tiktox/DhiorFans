import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useDynamicStatus = (postId: string, initialIsActive?: boolean) => {
  const [isActive, setIsActive] = useState(initialIsActive ?? true);
  const lastValueRef = useRef(initialIsActive ?? true);

  useEffect(() => {
    // Solo suscribirse si es una dinámica
    if (initialIsActive === undefined) return;
    
    const unsubscribe = onSnapshot(doc(db, 'posts', postId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const newIsActive = data.isActive ?? true;
        
        // Solo actualizar si el valor realmente cambió
        if (newIsActive !== lastValueRef.current) {
          lastValueRef.current = newIsActive;
          setIsActive(newIsActive);
        }
      }
    });

    return unsubscribe;
  }, [postId, initialIsActive]);

  return isActive;
};