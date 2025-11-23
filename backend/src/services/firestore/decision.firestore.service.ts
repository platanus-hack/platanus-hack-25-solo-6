// firestore
import { Firestore } from "@google-cloud/firestore";

// types
import type { Decision, CreateDecisionRequest } from "./types/decision.types.js";

export class DecisionFirestoreService {
  private firestore: Firestore;
  private collectionName: string;

  constructor() {
    this.firestore = new Firestore();
    this.collectionName = "decisions-felipe";
  }

  /**
   * Create a new decision
   */
  async createDecision(request: CreateDecisionRequest): Promise<Decision> {
    const docRef = this.firestore.collection(this.collectionName).doc();

    const decision: Decision = {
      id: docRef.id,
      userId: request.userId,
      decision: request.decision,
      consequences: request.consequences,
      createdAt: new Date().toISOString(),
    };

    try {
      await docRef.set(decision);
      return decision;
    } catch (error) {
      console.error("Error creating decision:", error);
      throw error;
    }
  }

  /**
   * Get a decision by ID
   */
  async getDecisionById(decisionId: string): Promise<Decision | null> {
    try {
      const docRef = this.firestore.collection(this.collectionName).doc(decisionId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        return null;
      }

      return docSnapshot.data() as Decision;
    } catch (error) {
      console.error(`Error getting decision ${decisionId}:`, error);
      throw error;
    }
  }

  /**
   * Get all decisions for a user (ordered by createdAt desc)
   */
  async getDecisionsByUserId(userId: string, limit: number = 50): Promise<Decision[]> {
    try {
      const snapshot = await this.firestore
        .collection(this.collectionName)
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as Decision);
    } catch (error) {
      console.error(`Error getting decisions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a decision
   */
  async deleteDecision(decisionId: string, userId: string): Promise<void> {
    try {
      const docRef = this.firestore.collection(this.collectionName).doc(decisionId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw new Error("Decision not found");
      }

      const decision = docSnapshot.data() as Decision;

      // Verify ownership
      if (decision.userId !== userId) {
        throw new Error("Unauthorized to delete this decision");
      }

      await docRef.delete();
    } catch (error) {
      console.error(`Error deleting decision ${decisionId}:`, error);
      throw error;
    }
  }

  /**
   * Update a decision
   */
  async updateDecision(
    decisionId: string,
    userId: string,
    updates: Partial<Omit<Decision, "id" | "userId" | "createdAt">>
  ): Promise<Decision> {
    try {
      const docRef = this.firestore.collection(this.collectionName).doc(decisionId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw new Error("Decision not found");
      }

      const decision = docSnapshot.data() as Decision;

      // Verify ownership
      if (decision.userId !== userId) {
        throw new Error("Unauthorized to update this decision");
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await docRef.update(updatedData);

      return {
        ...decision,
        ...updatedData,
      };
    } catch (error) {
      console.error(`Error updating decision ${decisionId}:`, error);
      throw error;
    }
  }
}

export const decisionFirestoreService = new DecisionFirestoreService();
