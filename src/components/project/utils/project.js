import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

export const saveProjectToFirestore = async (projectId, newData) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...newData,
      lastEdited: serverTimestamp(),
    });
    console.log('✅ Projekt úspěšně uložen.');
  } catch (error) {
    console.error('❌ Chyba při ukládání projektu:', error);
  }
};
