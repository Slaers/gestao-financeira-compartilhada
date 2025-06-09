import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Lancamento } from '../models/lancamento.model';

@Injectable({
  providedIn: 'root'
})
export class LancamentoService {
  private lancamentosCollection: AngularFirestoreCollection<Lancamento>;

  constructor(private afs: AngularFirestore) {
    this.lancamentosCollection = afs.collection<Lancamento>('lancamentos');
  }

  // Get all lancamentos (for dashboard, etc.)
  getLancamentos(): Observable<Lancamento[]> {
    return this.lancamentosCollection.valueChanges({ idField: 'id' });
  }

  // Add a new lancamento
  addLancamento(lancamento: Lancamento): Promise<any> {
    const id = this.afs.createId();
    return this.lancamentosCollection.doc(id).set({...lancamento, id});
  }

  // Update a lancamento (if needed later)
  updateLancamento(id: string, data: Partial<Lancamento>): Promise<void> {
    return this.lancamentosCollection.doc(id).update(data);
  }

  // Delete a lancamento (if needed later)
  deleteLancamento(id: string): Promise<void> {
    return this.lancamentosCollection.doc(id).delete();
  }
}
