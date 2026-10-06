import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { B2BProfile, ProductionOrder, QuotationConfig } from '../types';

export interface FirestoreQuoteData {
  quoteId: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  projectName: string;
  technology: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxVat: number;
  total: number;
  volumeCm3?: number;
  weightGrams?: number;
  createdAt: string;
}

export interface FirestoreMeetingData {
  meetingId: string;
  userId?: string;
  name: string;
  email: string;
  company?: string;
  date: string;
  time: string;
  topic?: string;
  projectDetails?: string;
  createdAt: string;
}

export async function saveUserProfile(userId: string, profile: Partial<B2BProfile>) {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(
      docRef,
      {
        userId,
        email: profile.email || '',
        displayName: profile.contactPerson || '',
        companyName: profile.companyName || '',
        vatId: profile.vatId || '',
        tier: profile.tier || 'Standard',
        totalSpent: profile.totalSpent ?? 0,
        ordersCount: profile.ordersCount ?? 0,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserProfile(userId: string): Promise<B2BProfile | null> {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        companyName: data.companyName || 'Empresa B2B',
        vatId: data.vatId || '',
        contactPerson: data.displayName || '',
        email: data.email || '',
        tier: data.tier || 'Standard',
        totalSpent: data.totalSpent || 0,
        ordersCount: data.ordersCount || 0,
        ndaSigned: true,
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveUserQuote(userId: string, quote: FirestoreQuoteData) {
  const path = `users/${userId}/quotes/${quote.quoteId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'quotes', quote.quoteId), quote);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeUserOrders(
  userId: string,
  onOrders: (orders: ProductionOrder[]) => void
) {
  const path = `users/${userId}/orders`;
  const q = query(collection(db, 'users', userId, 'orders'));

  return onSnapshot(
    q,
    (snapshot) => {
      const ordersList: ProductionOrder[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        ordersList.push({
          id: d.orderId || docSnap.id,
          date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES'),
          projectName: d.projectName || 'Proyecto CAD',
          technology: d.technology || 'fdm',
          materialName: d.materialName || 'Material Estándar',
          quantity: d.quantity || 1,
          status: d.status || 'CAD_VERIFIED',
          progressPercent: d.progressPercent || 25,
          total: d.total || 0,
          trackingNumber: d.trackingNumber,
          estimatedDelivery: d.estimatedDelivery || '3-5 días hábiles',
          geometrySnapshot: d.geometrySnapshot,
          config: d.config || {
            technology: d.technology || 'fdm',
            materialId: 'fdm-pla',
            infillPercent: 40,
            layerHeightMm: 0.16,
            quantity: d.quantity || 1,
            color: 'Negro',
            postProcessingIds: ['pp-standard'],
            deliverySpeed: 'standard',
            unit: 'mm',
          },
        });
      });
      onOrders(ordersList);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

export async function saveUserOrder(userId: string, order: ProductionOrder) {
  const path = `users/${userId}/orders/${order.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'orders', order.id), {
      orderId: order.id,
      userId,
      projectName: order.projectName,
      technology: order.technology,
      materialName: order.materialName,
      quantity: order.quantity,
      status: order.status,
      progressPercent: order.progressPercent,
      total: order.total,
      trackingNumber: order.trackingNumber || '',
      estimatedDelivery: order.estimatedDelivery || '',
      geometrySnapshot: order.geometrySnapshot || '',
      config: order.config,
      createdAt: new Date().toISOString(),
    });

    // Update user stats
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const uData = userSnap.data();
      const newTotal = (uData.totalSpent || 0) + order.total;
      const newCount = (uData.ordersCount || 0) + 1;
      let newTier = uData.tier || 'Standard';
      if (newTotal >= 35000) newTier = 'Partner';
      else if (newTotal >= 15000) newTier = 'Gold';
      else if (newTotal >= 5000) newTier = 'Silver';

      await updateDoc(userRef, {
        totalSpent: newTotal,
        ordersCount: newCount,
        tier: newTier,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function scheduleMeetingInFirestore(meeting: FirestoreMeetingData) {
  const path = `meetings/${meeting.meetingId}`;
  try {
    await setDoc(doc(db, 'meetings', meeting.meetingId), meeting);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}
