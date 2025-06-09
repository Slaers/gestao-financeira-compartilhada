import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  Firestore,
  setDoc,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { Lancamento } from '../models/lancamento.model';
import { firebaseConfig } from './firebase-config';

let app: FirebaseApp;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}
const db: Firestore = getFirestore(app);
const lancamentosCollectionRef: CollectionReference = collection(db, 'lancamentos');

class LancamentoService {

  async getLancamentos(): Promise<Lancamento[]> {
    try {
      const snapshot = await getDocs(lancamentosCollectionRef);
      return snapshot.docs.map(document => ({ ...document.data(), id: document.id } as Lancamento));
    } catch (error) {
      console.error("Error fetching lancamentos:", error);
      throw error;
    }
  }

  async addLancamento(lancamentoData: Omit<Lancamento, 'id' | 'data'> & { data: Date }): Promise<string> {
    try {
      const newDocRef: DocumentReference = doc(lancamentosCollectionRef);
      const dataWithTimestamp: Lancamento = {
        ...lancamentoData,
        id: newDocRef.id,
        data: Timestamp.fromDate(lancamentoData.data)
      };
      await setDoc(newDocRef, dataWithTimestamp);
      console.log("Lancamento added with ID:", newDocRef.id);
      return newDocRef.id;
    } catch (error) {
      console.error("Error adding lancamento:", error);
      throw error;
    }
  }

  async updateLancamento(id: string, data: Partial<Omit<Lancamento, 'data'>> & { data?: Date }): Promise<void> {
    try {
      const docRef: DocumentReference = doc(db, 'lancamentos', id);
      const updateData: Partial<Lancamento> = { ...data };

      if (data.data) {
        updateData.data = Timestamp.fromDate(data.data);
      }

      await updateDoc(docRef, updateData);
      console.log("Lancamento updated for ID:", id);
    } catch (error) {
      console.error("Error updating lancamento:", error);
      throw error;
    }
  }

  async deleteLancamento(id: string): Promise<void> {
    try {
      const docRef: DocumentReference = doc(db, 'lancamentos', id);
      await deleteDoc(docRef);
      console.log("Lancamento deleted with ID:", id);
    } catch (error) {
      console.error("Error deleting lancamento:", error);
      throw error;
    }
  }
}

export const lancamentoService = new LancamentoService();
