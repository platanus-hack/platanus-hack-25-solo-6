// firestore
import { Firestore } from "@google-cloud/firestore";

// types
import type { Decision, CreateDecisionRequest, Consequence } from "./types/decision.types.js";

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

  /**
   * Update a nested consequence with expanded consequences
   * nodeId format: "consequence-0-1-2" represents path in the tree
   */
  async updateNestedConsequence(
    decisionId: string,
    userId: string,
    nodeId: string,
    expandedConsequences: Consequence[]
  ): Promise<Decision> {
    try {
      const decision = await this.getDecisionById(decisionId);

      if (!decision) {
        throw new Error("Decision not found");
      }

      // Verify ownership
      if (decision.userId !== userId) {
        throw new Error("Unauthorized to update this decision");
      }

      // Parse nodeId to get the path: "consequence-0-1-2" -> [0, 1, 2]
      const pathParts = nodeId.split("-").slice(1); // Remove "consequence" prefix
      const indices = pathParts.map((p) => parseInt(p, 10));

      console.log(`📍 Updating nested consequence at path: ${indices.join(" -> ")}`);

      // Navigate to the target consequence and update it
      const updatedConsequences = this.updateConsequenceAtPath(
        decision.consequences,
        indices,
        expandedConsequences
      );

      // Update the entire decision with the new consequences tree
      const updatedDecision = await this.updateDecision(decisionId, userId, {
        consequences: updatedConsequences,
      });

      console.log(`✅ Successfully updated nested consequence in decision ${decisionId}`);
      return updatedDecision;
    } catch (error) {
      console.error(`Error updating nested consequence:`, error);
      throw error;
    }
  }

  /**
   * Recursively navigate and update a consequence at a specific path
   */
  private updateConsequenceAtPath(
    consequences: Consequence[],
    path: number[],
    expandedConsequences: Consequence[]
  ): Consequence[] {
    if (path.length === 0) {
      throw new Error("Invalid path: cannot be empty");
    }

    const [currentIndex, ...remainingPath] = path;

    if (currentIndex === undefined) {
      throw new Error("Invalid path: index is undefined");
    }

    // Clone the array to avoid mutations
    const updated = [...consequences];

    if (currentIndex >= updated.length || !updated[currentIndex]) {
      throw new Error(`Invalid index ${currentIndex} in path`);
    }

    const targetConsequence = updated[currentIndex];

    // If this is the last index in the path, update this consequence
    if (remainingPath.length === 0) {
      updated[currentIndex] = {
        ...targetConsequence,
        expandedConsequences,
      };
      console.log(`  ✅ Updated consequence at index ${currentIndex}`);
    } else {
      // Otherwise, recurse deeper
      const childConsequences = targetConsequence.expandedConsequences || [];

      updated[currentIndex] = {
        ...targetConsequence,
        expandedConsequences: this.updateConsequenceAtPath(
          childConsequences,
          remainingPath,
          expandedConsequences
        ),
      };
    }

    return updated;
  }
}

export const decisionFirestoreService = new DecisionFirestoreService();
