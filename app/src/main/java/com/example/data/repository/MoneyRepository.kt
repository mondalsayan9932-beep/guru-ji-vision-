package com.example.data.repository

import com.example.core.OperationType
import com.example.core.handleFirestoreError
import com.example.data.model.FinancialGoal
import com.example.data.model.MoneyTransaction
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

class MoneyRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    private fun requireUserId(): String =
        auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google.")

    fun observeTransactions(userId: String): Flow<List<MoneyTransaction>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Refusing cross-user financial read." }
        val path = "users/$uid/transactions"
        emitAll(
            db.collection("users").document(uid).collection("transactions")
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        MoneyTransaction::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    fun observeGoals(userId: String): Flow<List<FinancialGoal>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Refusing cross-user budget read." }
        val path = "users/$uid/budgets"
        emitAll(
            db.collection("users").document(uid).collection("budgets")
                .snapshots()
                .map { snap ->
                    snap.toObjects(
                        FinancialGoal::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val toLog = firestoreError ?: (error as? Exception)
                    if (toLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(toLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    suspend fun addTransaction(
        title: String,
        amount: Double,
        type: String,
        category: String,
        note: String,
        dateLabel: String,
        sharedWith: String?
    ): Result<Unit> {
        var path = "users/unknown/transactions"
        return try {
            val uid = requireUserId()
            val cleanTitle = title.trim()
            require(cleanTitle.length in 1..100) { "Title must be 1–100 characters." }
            require(amount > 0.0 && amount <= 10_000_000.0) { "Amount must be greater than ₹0." }
            val safeType = if (type == "INCOME") "INCOME" else "EXPENSE"
            val docRef = db.collection("users").document(uid).collection("transactions").document()
            path = docRef.path

            val cleanShared = sharedWith?.trim()?.take(100)?.takeIf { it.isNotEmpty() }
            val payload = mapOf<String, Any?>(
                "title" to cleanTitle,
                "amount" to amount,
                "type" to safeType,
                "category" to category,
                "note" to note.trim().take(300),
                "dateLabel" to dateLabel.trim().ifBlank { "Today" }.take(30),
                "sharedWith" to cleanShared,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            ).filterValues { it != null }

            docRef.set(payload).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateTransaction(
        transactionId: String,
        title: String,
        amount: Double,
        type: String,
        category: String,
        note: String,
        dateLabel: String,
        sharedWith: String?
    ): Result<Unit> {
        var path = "users/unknown/transactions/$transactionId"
        return try {
            val uid = requireUserId()
            require(transactionId.isNotBlank()) { "Transaction ID required." }
            val cleanTitle = title.trim()
            require(cleanTitle.length in 1..100) { "Title must be 1–100 characters." }
            require(amount > 0.0 && amount <= 10_000_000.0) { "Amount must be greater than ₹0." }
            val safeType = if (type == "INCOME") "INCOME" else "EXPENSE"
            val docRef = db.collection("users").document(uid).collection("transactions").document(transactionId)
            path = docRef.path

            val cleanShared = sharedWith?.trim()?.take(100)?.takeIf { it.isNotEmpty() }
            val updates = mutableMapOf<String, Any>(
                "title" to cleanTitle,
                "amount" to amount,
                "type" to safeType,
                "category" to category,
                "note" to note.trim().take(300),
                "dateLabel" to dateLabel.trim().ifBlank { "Today" }.take(30),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            updates["sharedWith"] = cleanShared ?: FieldValue.delete()

            docRef.update(updates).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteTransaction(transactionId: String): Result<Unit> {
        var path = "users/unknown/transactions/$transactionId"
        return try {
            val uid = requireUserId()
            require(transactionId.isNotBlank())
            val docRef = db.collection("users").document(uid).collection("transactions").document(transactionId)
            path = docRef.path
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    suspend fun addGoal(
        name: String,
        kind: String,
        targetAmount: Double,
        savedAmount: Double,
        monthKey: String
    ): Result<Unit> {
        var path = "users/unknown/budgets"
        return try {
            val uid = requireUserId()
            val cleanName = name.trim()
            require(cleanName.length in 1..80) { "Goal name must be 1–80 characters." }
            require(targetAmount > 0.0 && targetAmount <= 10_000_000.0) { "Target must be > ₹0." }
            require(savedAmount >= 0.0 && savedAmount <= 10_000_000.0) { "Saved amount must be >= ₹0." }
            val safeKind = if (kind == "SAVINGS_GOAL") "SAVINGS_GOAL" else "MONTHLY_BUDGET"
            val docRef = db.collection("users").document(uid).collection("budgets").document()
            path = docRef.path

            docRef.set(
                mapOf(
                    "name" to cleanName,
                    "kind" to safeKind,
                    "targetAmount" to targetAmount,
                    "savedAmount" to savedAmount,
                    "monthKey" to monthKey.trim().ifBlank { "2026-11" }.take(20),
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateGoalSavedAmount(goalId: String, newSavedAmount: Double): Result<Unit> {
        var path = "users/unknown/budgets/$goalId"
        return try {
            val uid = requireUserId()
            require(goalId.isNotBlank())
            require(newSavedAmount >= 0.0 && newSavedAmount <= 10_000_000.0)
            val docRef = db.collection("users").document(uid).collection("budgets").document(goalId)
            path = docRef.path
            docRef.update(
                mapOf(
                    "savedAmount" to newSavedAmount,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateGoal(
        goalId: String,
        name: String,
        kind: String,
        targetAmount: Double,
        savedAmount: Double,
        monthKey: String
    ): Result<Unit> {
        var path = "users/unknown/budgets/$goalId"
        return try {
            val uid = requireUserId()
            require(goalId.isNotBlank()) { "Goal ID required." }
            val cleanName = name.trim()
            require(cleanName.length in 1..80) { "Goal name must be 1–80 characters." }
            require(targetAmount > 0.0 && targetAmount <= 10_000_000.0) { "Target must be > ₹0." }
            require(savedAmount >= 0.0 && savedAmount <= 10_000_000.0) { "Saved amount must be >= ₹0." }
            val safeKind = if (kind == "SAVINGS_GOAL") "SAVINGS_GOAL" else "MONTHLY_BUDGET"
            val docRef = db.collection("users").document(uid).collection("budgets").document(goalId)
            path = docRef.path
            docRef.update(
                mapOf(
                    "name" to cleanName,
                    "kind" to safeKind,
                    "targetAmount" to targetAmount,
                    "savedAmount" to savedAmount,
                    "monthKey" to monthKey.trim().ifBlank { "2026-11" }.take(20),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteGoal(goalId: String): Result<Unit> {
        var path = "users/unknown/budgets/$goalId"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid).collection("budgets").document(goalId)
            path = docRef.path
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }
}
