package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.core.AppLanguage
import com.example.core.L10n
import com.example.core.formatInr
import com.example.core.t
import com.example.data.model.FinancialGoal
import com.example.data.model.MoneyTransaction
import com.example.data.model.UiState
import com.example.ui.components.CategorySpendingBarChart
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.ErrorBannerCard
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val expenseCategories = listOf(
    "FOOD_MESS" to "Food & Mess",
    "HOSTEL_RENT" to "Hostel & Rent",
    "EDUCATION" to "Education",
    "TRAVEL_RECHARGE" to "Travel & Recharge",
    "SHARED" to "Shared Expense",
    "SAVINGS" to "Savings",
    "OTHER" to "Other"
)

private val incomeCategories = listOf(
    "ALLOWANCE" to "Home Allowance",
    "SCHOLARSHIP" to "Scholarship",
    "OTHER" to "Other Income"
)

data class MonthlyFinanceSummary(
    val monthKey: String,
    val income: Double,
    val expense: Double
) {
    val remainingBalance: Double get() = income - expense
}

fun computeMonthlyFinanceSummaries(transactions: List<MoneyTransaction>): List<MonthlyFinanceSummary> {
    return transactions
        .groupBy { tx ->
            val raw = tx.dateLabel.trim()
            if (raw.length >= 7 && raw[4] == '-') raw.substring(0, 7) else "Current"
        }
        .map { (monthKey, items) ->
            val inc = items.filter { it.type == "INCOME" }.sumOf { it.amount }
            val exp = items.filter { it.type == "EXPENSE" }.sumOf { it.amount }
            MonthlyFinanceSummary(monthKey = monthKey, income = inc, expense = exp)
        }
        .sortedByDescending { it.monthKey }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MoneyManagerScreen(
    language: AppLanguage,
    transactionsState: UiState<List<MoneyTransaction>>,
    goalsState: UiState<List<FinancialGoal>>,
    busy: Boolean,
    onBack: () -> Unit,
    onAddTransaction: (
        title: String,
        amount: Double,
        type: String,
        category: String,
        note: String,
        dateLabel: String,
        sharedWith: String?,
        onSuccess: () -> Unit
    ) -> Unit,
    onUpdateTransaction: (
        transactionId: String,
        title: String,
        amount: Double,
        type: String,
        category: String,
        note: String,
        dateLabel: String,
        sharedWith: String?,
        onSuccess: () -> Unit
    ) -> Unit,
    onDeleteTransaction: (String) -> Unit,
    onAddGoal: (
        name: String,
        kind: String,
        targetAmount: Double,
        savedAmount: Double,
        monthKey: String,
        onSuccess: () -> Unit
    ) -> Unit,
    onUpdateGoal: (
        goalId: String,
        name: String,
        kind: String,
        targetAmount: Double,
        savedAmount: Double,
        monthKey: String,
        onSuccess: () -> Unit
    ) -> Unit,
    onAddGoalProgress: (goalId: String, currentSaved: Double, delta: Double) -> Unit,
    onDeleteGoal: (String) -> Unit
) {
    var showAddTxDialog by remember { mutableStateOf(false) }
    var editingTx by remember { mutableStateOf<MoneyTransaction?>(null) }
    var showAddGoalDialog by remember { mutableStateOf(false) }
    var editingGoal by remember { mutableStateOf<FinancialGoal?>(null) }

    val transactions = (transactionsState as? UiState.Success)?.data.orEmpty()
    val goals = (goalsState as? UiState.Success)?.data.orEmpty()

    val totalIncome = transactions.filter { it.type == "INCOME" }.sumOf { it.amount }
    val totalExpense = transactions.filter { it.type == "EXPENSE" }.sumOf { it.amount }
    val netBalance = totalIncome - totalExpense

    val monthlySummaries = remember(transactions) {
        computeMonthlyFinanceSummaries(transactions)
    }

    val categoryBreakdown = remember(transactions) {
        transactions
            .filter { it.type == "EXPENSE" }
            .groupBy { it.category }
            .map { (cat, list) ->
                val label = expenseCategories.firstOrNull { it.first == cat }?.second ?: cat
                label to list.sumOf { it.amount }
            }
            .sortedByDescending { it.second }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header with Back + Privacy Shield
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.testTag("money_back_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                    Column {
                        Text(
                            text = L10n.moneyManager(language),
                            style = MaterialTheme.typography.titleLarge
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                Icons.Filled.Lock,
                                contentDescription = "Private",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = t(
                                    language,
                                    "100% Private — Only you can view, edit & delete (INR ₹)",
                                    "১০০% ব্যক্তিগত — শুধুমাত্র আপনিই দেখতে ও এডিট করতে পারবেন (₹)"
                                ),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }

        // Net Balance Hero Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = t(language, "Available Student Balance", "বর্তমান ব্যালেন্স"),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f)
                    )
                    Text(
                        text = formatInr(netBalance),
                        style = MaterialTheme.typography.displaySmall,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color.White.copy(alpha = 0.14f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = t(language, "Total Income", "মোট আয়"),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.White.copy(alpha = 0.85f)
                                )
                                Text(
                                    text = formatInr(totalIncome),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color.White
                                )
                            }
                        }
                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color.White.copy(alpha = 0.14f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = t(language, "Total Expenses", "মোট ব্যয়"),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.White.copy(alpha = 0.85f)
                                )
                                Text(
                                    text = formatInr(totalExpense),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color(0xFFFDE68A)
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = { showAddTxDialog = true },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("money_add_tx_button"),
                            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                containerColor = Color.White,
                                contentColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(t(language, "Add Entry", "লেনদেন যোগ করুন"))
                        }
                        OutlinedButton(
                            onClick = { showAddGoalDialog = true },
                            modifier = Modifier.testTag("money_add_goal_button"),
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.6f))
                        ) {
                            Icon(
                                Icons.Filled.Savings,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(t(language, "Budget / Goal", "বাজেট / লক্ষ্য"), color = Color.White)
                        }
                    }
                }
            }
        }

        // Monthly Income & Expense Reports Card
        if (monthlySummaries.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("money_monthly_report_card"),
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SectionHeader(
                            title = t(language, "Monthly Income & Expense Report", "মাসিক আয় ও ব্যয় রিপোর্ট"),
                            subtitle = t(language, "Private remaining balance by month (INR ₹)", "মাস অনুযায়ী ব্যক্তিগত হিসাব (₹)")
                        )
                        monthlySummaries.take(6).forEach { m ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(m.monthKey, style = MaterialTheme.typography.titleSmall)
                                    Text(
                                        text = "${t(language, "In", "আয়")}: ${formatInr(m.income)}  •  ${t(language, "Out", "ব্যয়")}: ${formatInr(m.expense)}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Text(
                                    text = formatInr(m.remainingBalance),
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = if (m.remainingBalance >= 0.0) Color(0xFF15803D) else MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }
        }

        // Monthly Report Bar Chart
        if (categoryBreakdown.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        SectionHeader(
                            title = t(language, "Category Expense Breakdown", "বিভাগ অনুযায়ী খরচের বিশ্লেষণ"),
                            subtitle = t(language, "Mess, Hostel, Education, Travel & Shared bills", "মেস, হোস্টেল, পড়াশোনা ও যাতায়াত")
                        )
                        CategorySpendingBarChart(entries = categoryBreakdown)
                    }
                }
            }
        }

        // Monthly Budgets & Savings Goals
        item {
            SectionHeader(
                title = t(language, "Budgets & Savings Goals", "মাসিক বাজেট ও সঞ্চয় লক্ষ্য")
            )
        }

        when (goalsState) {
            UiState.Loading -> item { CircularProgressIndicator() }
            is UiState.Error -> item { ErrorBannerCard(goalsState.message) }
            is UiState.Success -> {
                if (goals.isEmpty()) {
                    item {
                        EmptyStateCard(
                            title = t(language, "No Monthly Budget or Savings Goal Yet", "কোনো বাজেট বা সঞ্চয় লক্ষ্য নেই"),
                            description = t(
                                language,
                                "Tap 'Budget / Goal' above to set your monthly hostel/mess cap or save for ICAR exam books.",
                                "মাসিক বাজেট বা বইয়ের জন্য সঞ্চয় লক্ষ্য তৈরি করুন।"
                            ),
                            icon = Icons.Filled.Savings
                        )
                    }
                } else {
                    items(goals, key = { it.id }) { goal ->
                        val isBudget = goal.kind == "MONTHLY_BUDGET"
                        val currentAmount = if (isBudget) totalExpense else goal.savedAmount
                        val progress = (currentAmount / goal.targetAmount.coerceAtLeast(1.0)).toFloat().coerceIn(0f, 1f)
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.medium,
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.55f))
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(goal.name, style = MaterialTheme.typography.titleSmall)
                                        Text(
                                            text = "${if (isBudget) "Spent" else "Saved"} ${formatInr(currentAmount)} / ${formatInr(goal.targetAmount)} (${goal.monthKey})",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        if (!isBudget) {
                                            TextButton(
                                                onClick = { onAddGoalProgress(goal.id, goal.savedAmount, 500.0) },
                                                modifier = Modifier.testTag("goal_add_500_${goal.id}")
                                            ) {
                                                Text("+₹500")
                                            }
                                        }
                                        IconButton(
                                            onClick = { editingGoal = goal },
                                            modifier = Modifier.testTag("goal_edit_${goal.id}")
                                        ) {
                                            Icon(Icons.Filled.Edit, contentDescription = "Edit goal", modifier = Modifier.size(18.dp))
                                        }
                                        IconButton(
                                            onClick = { onDeleteGoal(goal.id) },
                                            modifier = Modifier.testTag("goal_delete_${goal.id}")
                                        ) {
                                            Icon(Icons.Filled.DeleteOutline, contentDescription = "Delete goal", modifier = Modifier.size(18.dp))
                                        }
                                    }
                                }
                                LinearProgressIndicator(
                                    progress = { progress },
                                    modifier = Modifier.fillMaxWidth().height(8.dp),
                                    color = if (isBudget && currentAmount > goal.targetAmount) {
                                        MaterialTheme.colorScheme.error
                                    } else {
                                        MaterialTheme.colorScheme.primary
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }

        // Private Financial Transactions Ledger
        item {
            SectionHeader(
                title = t(language, "Recent Financial Records", "সাম্প্রতিক লেনদেনের তালিকা"),
                subtitle = "${transactions.size} ${t(language, "records", "টি এন্ট্রি")}"
            )
        }

        when (transactionsState) {
            UiState.Loading -> item { CircularProgressIndicator() }
            is UiState.Error -> item { ErrorBannerCard(transactionsState.message) }
            is UiState.Success -> {
                if (transactions.isEmpty()) {
                    item {
                        EmptyStateCard(
                            title = t(language, "No Financial Records Yet", "এখনো কোনো হিসাব যোগ করা হয়নি"),
                            description = t(
                                language,
                                "Record your daily food/mess, hostel rent, books, travel, scholarship, or shared roommate expenses in INR (₹).",
                                "আপনার দৈনিক মেস, হোস্টেল, পড়াশোনা, বৃত্তি বা রুমমেটের সাথে ভাগ করা খরচ যোগ করুন।"
                            ),
                            icon = Icons.Filled.AccountBalanceWallet
                        )
                    }
                } else {
                    items(transactions, key = { it.id }) { tx ->
                        val isIncome = tx.type == "INCOME"
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = MaterialTheme.shapes.medium,
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(
                                    modifier = Modifier.weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(3.dp)
                                ) {
                                    Text(tx.title, style = MaterialTheme.typography.titleSmall)
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        StatusPill(
                                            label = tx.category.replace('_', ' '),
                                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                                            contentColor = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text(
                                            text = tx.dateLabel,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.align(Alignment.CenterVertically)
                                        )
                                    }
                                    if (!tx.sharedWith.isNullOrBlank()) {
                                        Text(
                                            text = "Shared with: ${tx.sharedWith}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.secondary
                                        )
                                    }
                                    if (tx.note.isNotBlank()) {
                                        Text(
                                            text = tx.note,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        text = (if (isIncome) "+" else "-") + formatInr(tx.amount),
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isIncome) Color(0xFF15803D) else MaterialTheme.colorScheme.error
                                    )
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        IconButton(
                                            onClick = { editingTx = tx },
                                            modifier = Modifier.testTag("tx_edit_${tx.id}")
                                        ) {
                                            Icon(
                                                Icons.Filled.Edit,
                                                contentDescription = "Edit transaction",
                                                tint = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                        IconButton(
                                            onClick = { onDeleteTransaction(tx.id) },
                                            modifier = Modifier.testTag("tx_delete_${tx.id}")
                                        ) {
                                            Icon(
                                                Icons.Filled.DeleteOutline,
                                                contentDescription = "Delete transaction",
                                                tint = MaterialTheme.colorScheme.error,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddTxDialog) {
        val today = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) }
        var txType by remember { mutableStateOf("EXPENSE") }
        var txTitle by remember { mutableStateOf("") }
        var txAmount by remember { mutableStateOf("") }
        var txCategory by remember { mutableStateOf("FOOD_MESS") }
        var txNote by remember { mutableStateOf("") }
        var txSharedWith by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddTxDialog = false },
            title = { Text(t(language, "Record Private Entry (₹)", "নতুন আয় / ব্যয় যোগ করুন (₹)")) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = txType == "EXPENSE",
                            onClick = {
                                txType = "EXPENSE"
                                txCategory = "FOOD_MESS"
                            },
                            label = { Text(t(language, "Expense", "ব্যয়")) },
                            modifier = Modifier.testTag("tx_type_expense")
                        )
                        FilterChip(
                            selected = txType == "INCOME",
                            onClick = {
                                txType = "INCOME"
                                txCategory = "ALLOWANCE"
                            },
                            label = { Text(t(language, "Income", "আয়")) },
                            modifier = Modifier.testTag("tx_type_income")
                        )
                    }
                    OutlinedTextField(
                        value = txTitle,
                        onValueChange = { txTitle = it },
                        label = { Text(t(language, "Title (e.g. Hostel Mess / Books)", "শিরোনাম")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("tx_title_input")
                    )
                    OutlinedTextField(
                        value = txAmount,
                        onValueChange = { txAmount = it },
                        label = { Text(t(language, "Amount (INR ₹)", "টাকার পরিমাণ (₹)")) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("tx_amount_input")
                    )
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        val list = if (txType == "INCOME") incomeCategories else expenseCategories
                        list.forEach { (code, label) ->
                            FilterChip(
                                selected = txCategory == code,
                                onClick = { txCategory = code },
                                label = { Text(label) }
                            )
                        }
                    }
                    if (txCategory == "SHARED") {
                        OutlinedTextField(
                            value = txSharedWith,
                            onValueChange = { txSharedWith = it },
                            label = { Text(t(language, "Shared With (Roommate / Group)", "কার সাথে ভাগ করা")) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    OutlinedTextField(
                        value = txNote,
                        onValueChange = { txNote = it },
                        label = { Text(t(language, "Note (Optional)", "নোট (ঐচ্ছিক)")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amt = txAmount.toDoubleOrNull() ?: 0.0
                        if (txTitle.isNotBlank() && amt > 0.0) {
                            onAddTransaction(
                                txTitle,
                                amt,
                                txType,
                                txCategory,
                                txNote,
                                today,
                                txSharedWith.takeIf { txCategory == "SHARED" && it.isNotBlank() }
                            ) {
                                showAddTxDialog = false
                            }
                        }
                    },
                    enabled = !busy && txTitle.isNotBlank() && (txAmount.toDoubleOrNull() ?: 0.0) > 0.0,
                    modifier = Modifier.testTag("tx_confirm_save")
                ) {
                    Text(t(language, "Save", "সেভ করুন"))
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddTxDialog = false }) {
                    Text(t(language, "Cancel", "বাতিল"))
                }
            }
        )
    }

    if (showAddGoalDialog) {
        val currentMonth = remember { SimpleDateFormat("yyyy-MM", Locale.US).format(Date()) }
        var kind by remember { mutableStateOf("MONTHLY_BUDGET") }
        var name by remember { mutableStateOf("") }
        var target by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddGoalDialog = false },
            title = { Text(t(language, "Set Budget or Savings Goal (₹)", "বাজেট বা সঞ্চয় লক্ষ্য সেট করুন (₹)")) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = kind == "MONTHLY_BUDGET",
                            onClick = { kind = "MONTHLY_BUDGET" },
                            label = { Text("Monthly Budget") }
                        )
                        FilterChip(
                            selected = kind == "SAVINGS_GOAL",
                            onClick = { kind = "SAVINGS_GOAL" },
                            label = { Text("Savings Goal") }
                        )
                    }
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text(t(language, "Goal Name", "লক্ষ্যের নাম")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("goal_name_input")
                    )
                    OutlinedTextField(
                        value = target,
                        onValueChange = { target = it },
                        label = { Text(t(language, "Target Amount (₹)", "লক্ষ্যমাত্রা (₹)")) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("goal_target_input")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val targetAmt = target.toDoubleOrNull() ?: 0.0
                        if (name.isNotBlank() && targetAmt > 0.0) {
                            onAddGoal(name, kind, targetAmt, 0.0, currentMonth) {
                                showAddGoalDialog = false
                            }
                        }
                    },
                    enabled = !busy && name.isNotBlank() && (target.toDoubleOrNull() ?: 0.0) > 0.0,
                    modifier = Modifier.testTag("goal_confirm_save")
                ) {
                    Text(t(language, "Save", "সেভ করুন"))
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddGoalDialog = false }) {
                    Text(t(language, "Cancel", "বাতিল"))
                }
            }
        )
    }

    // Edit Personal Income / Expense Record Dialog
    val txToEdit = editingTx
    if (txToEdit != null) {
        var txType by remember(txToEdit.id) { mutableStateOf(txToEdit.type) }
        var txTitle by remember(txToEdit.id) { mutableStateOf(txToEdit.title) }
        var txAmount by remember(txToEdit.id) { mutableStateOf(txToEdit.amount.toString()) }
        var txCategory by remember(txToEdit.id) { mutableStateOf(txToEdit.category) }
        var txDate by remember(txToEdit.id) { mutableStateOf(txToEdit.dateLabel) }
        var txNote by remember(txToEdit.id) { mutableStateOf(txToEdit.note) }
        var txSharedWith by remember(txToEdit.id) { mutableStateOf(txToEdit.sharedWith.orEmpty()) }

        AlertDialog(
            onDismissRequest = { editingTx = null },
            title = { Text(t(language, "Edit Personal Record (₹)", "ব্যক্তিগত লেনদেন এডিট করুন (₹)")) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = txType == "EXPENSE",
                            onClick = {
                                txType = "EXPENSE"
                                if (expenseCategories.none { it.first == txCategory }) txCategory = "FOOD_MESS"
                            },
                            label = { Text(t(language, "Expense", "ব্যয়")) },
                            modifier = Modifier.testTag("edit_tx_type_expense")
                        )
                        FilterChip(
                            selected = txType == "INCOME",
                            onClick = {
                                txType = "INCOME"
                                if (incomeCategories.none { it.first == txCategory }) txCategory = "ALLOWANCE"
                            },
                            label = { Text(t(language, "Income", "আয়")) },
                            modifier = Modifier.testTag("edit_tx_type_income")
                        )
                    }
                    OutlinedTextField(
                        value = txTitle,
                        onValueChange = { txTitle = it },
                        label = { Text(t(language, "Title", "শিরোনাম")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("edit_tx_title_input")
                    )
                    OutlinedTextField(
                        value = txAmount,
                        onValueChange = { txAmount = it },
                        label = { Text(t(language, "Amount (INR ₹)", "টাকার পরিমাণ (₹)")) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("edit_tx_amount_input")
                    )
                    OutlinedTextField(
                        value = txDate,
                        onValueChange = { txDate = it },
                        label = { Text(t(language, "Date (YYYY-MM-DD)", "তারিখ (YYYY-MM-DD)")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("edit_tx_date_input")
                    )
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        val list = if (txType == "INCOME") incomeCategories else expenseCategories
                        list.forEach { (code, label) ->
                            FilterChip(
                                selected = txCategory == code,
                                onClick = { txCategory = code },
                                label = { Text(label) }
                            )
                        }
                    }
                    if (txCategory == "SHARED") {
                        OutlinedTextField(
                            value = txSharedWith,
                            onValueChange = { txSharedWith = it },
                            label = { Text(t(language, "Shared With", "কার সাথে ভাগ করা")) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    OutlinedTextField(
                        value = txNote,
                        onValueChange = { txNote = it },
                        label = { Text(t(language, "Note (Optional)", "নোট (ঐচ্ছিক)")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amt = txAmount.toDoubleOrNull() ?: 0.0
                        if (txTitle.isNotBlank() && amt > 0.0) {
                            onUpdateTransaction(
                                txToEdit.id,
                                txTitle,
                                amt,
                                txType,
                                txCategory,
                                txNote,
                                txDate,
                                txSharedWith.takeIf { txCategory == "SHARED" && it.isNotBlank() }
                            ) {
                                editingTx = null
                            }
                        }
                    },
                    enabled = !busy && txTitle.isNotBlank() && (txAmount.toDoubleOrNull() ?: 0.0) > 0.0,
                    modifier = Modifier.testTag("edit_tx_confirm_save")
                ) {
                    Text(t(language, "Update", "আপডেট করুন"))
                }
            },
            dismissButton = {
                TextButton(onClick = { editingTx = null }) {
                    Text(t(language, "Cancel", "বাতিল"))
                }
            }
        )
    }

    // Edit Monthly Budget / Savings Goal Dialog
    val goalToEdit = editingGoal
    if (goalToEdit != null) {
        var kind by remember(goalToEdit.id) { mutableStateOf(goalToEdit.kind) }
        var name by remember(goalToEdit.id) { mutableStateOf(goalToEdit.name) }
        var target by remember(goalToEdit.id) { mutableStateOf(goalToEdit.targetAmount.toString()) }
        var saved by remember(goalToEdit.id) { mutableStateOf(goalToEdit.savedAmount.toString()) }
        var monthKey by remember(goalToEdit.id) { mutableStateOf(goalToEdit.monthKey) }

        AlertDialog(
            onDismissRequest = { editingGoal = null },
            title = { Text(t(language, "Edit Budget or Savings Goal (₹)", "বাজেট বা সঞ্চয় লক্ষ্য এডিট করুন (₹)")) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = kind == "MONTHLY_BUDGET",
                            onClick = { kind = "MONTHLY_BUDGET" },
                            label = { Text("Monthly Budget") }
                        )
                        FilterChip(
                            selected = kind == "SAVINGS_GOAL",
                            onClick = { kind = "SAVINGS_GOAL" },
                            label = { Text("Savings Goal") }
                        )
                    }
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text(t(language, "Goal Name", "লক্ষ্যের নাম")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("edit_goal_name_input")
                    )
                    OutlinedTextField(
                        value = target,
                        onValueChange = { target = it },
                        label = { Text(t(language, "Target Amount (₹)", "লক্ষ্যমাত্রা (₹)")) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("edit_goal_target_input")
                    )
                    if (kind == "SAVINGS_GOAL") {
                        OutlinedTextField(
                            value = saved,
                            onValueChange = { saved = it },
                            label = { Text(t(language, "Saved So Far (₹)", "এখন পর্যন্ত সঞ্চিত (₹)")) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("edit_goal_saved_input")
                        )
                    }
                    OutlinedTextField(
                        value = monthKey,
                        onValueChange = { monthKey = it },
                        label = { Text(t(language, "Month (YYYY-MM)", "মাস (YYYY-MM)")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val targetAmt = target.toDoubleOrNull() ?: 0.0
                        val savedAmt = (saved.toDoubleOrNull() ?: 0.0).coerceAtLeast(0.0)
                        if (name.isNotBlank() && targetAmt > 0.0) {
                            onUpdateGoal(goalToEdit.id, name, kind, targetAmt, savedAmt, monthKey) {
                                editingGoal = null
                            }
                        }
                    },
                    enabled = !busy && name.isNotBlank() && (target.toDoubleOrNull() ?: 0.0) > 0.0,
                    modifier = Modifier.testTag("edit_goal_confirm_save")
                ) {
                    Text(t(language, "Update", "আপডেট করুন"))
                }
            },
            dismissButton = {
                TextButton(onClick = { editingGoal = null }) {
                    Text(t(language, "Cancel", "বাতিল"))
                }
            }
        )
    }
}
