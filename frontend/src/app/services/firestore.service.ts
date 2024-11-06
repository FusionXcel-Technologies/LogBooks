// src/app/services/firestore.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) { }

  /**
   * **Get a collection from Firestore**
   * @param collectionName Name of the collection
   * @returns Observable of collection data
   */
  getCollection(collectionName: string): Observable<any[]> {
    const coll = collection(this.firestore, collectionName);
    return collectionData(coll, { idField: 'id' }) as Observable<any[]>;
  }

  /**
   * **Add a document to a collection**
   * @param collectionName Name of the collection
   * @param data Data to add
   * @returns Promise resolving to the added document reference
   */
  addDocument(collectionName: string, data: any): Promise<any> {
    const coll = collection(this.firestore, collectionName);
    return addDoc(coll, data);
  }

  /**
   * **Set a document in a collection with a specific ID**
   * @param collectionName Name of the collection
   * @param id Document ID
   * @param data Data to set
   * @returns Promise resolving when the document is set
   */
  setDocument(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, collectionName, id);
    return setDoc(docRef, data);
  }

  /**
   * **Update a document in a collection**
   * @param collectionName Name of the collection
   * @param id Document ID
   * @param data Data to update
   * @returns Promise resolving when the document is updated
   */
  updateDocument(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, collectionName, id);
    return updateDoc(docRef, data);
  }

  /**
   * **Delete a document from a collection**
   * @param collectionName Name of the collection
   * @param id Document ID
   * @returns Promise resolving when the document is deleted
   */
  deleteDocument(collectionName: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, collectionName, id);
    return deleteDoc(docRef);
  }
}
