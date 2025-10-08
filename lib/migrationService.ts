import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { migrateUserTokens } from './tokenService';
import { UserData } from './userService';

// Función para migrar TODOS los usuarios existentes (ejecutar una sola vez)
export const migrateAllUsersTokens = async (): Promise<void> => {
  try {
    console.log('🔄 Iniciando migración masiva de tokens...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;
    let migratedCount = 0;
    
    console.log(`📊 Total de usuarios a migrar: ${totalUsers}`);
    
    const migrationPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const userData = userDoc.data() as UserData;
      
      try {
        await migrateUserTokens(userId, userData.followers || 0);
        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`📈 Progreso: ${migratedCount}/${totalUsers} usuarios migrados`);
        }
      } catch (error) {
        console.error(`❌ Error migrando usuario ${userId}:`, error);
      }
    });
    
    await Promise.all(migrationPromises);
    
    console.log(`✅ Migración completada: ${migratedCount}/${totalUsers} usuarios migrados`);
  } catch (error) {
    console.error('❌ Error en migración masiva:', error);
  }
};

// Función para verificar el estado de migración
export const checkMigrationStatus = async (): Promise<{ totalUsers: number; usersWithTokens: number }> => {
  try {
    const [usersSnapshot, tokensSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'tokens'))
    ]);
    
    return {
      totalUsers: usersSnapshot.size,
      usersWithTokens: tokensSnapshot.size
    };
  } catch (error) {
    console.error('Error verificando estado de migración:', error);
    return { totalUsers: 0, usersWithTokens: 0 };
  }
};