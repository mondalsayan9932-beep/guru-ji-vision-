package com.example.ui.components

import android.os.SystemClock
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Width breakpoints covering 320dp ultra-compact Android phones through
 * 360dp/390dp/412dp/480dp smartphones, tablets (600dp–839dp), and desktop/large tablets (840dp+).
 */
enum class WindowWidthTier {
    ULTRA_COMPACT, // < 360.dp (e.g. 320dp budget/small Android smartphones)
    COMPACT,       // 360.dp .. 599.dp (standard Android phones: 360dp, 390dp, 412dp, 480dp)
    MEDIUM,        // 600.dp .. 839.dp (foldables & small tablets)
    EXPANDED       // >= 840.dp (large tablets & desktop/ChromeOS)
}

@Immutable
data class ResponsiveMetrics(
    val maxWidth: Dp,
    val tier: WindowWidthTier,
    val horizontalPadding: Dp,
    val cardPadding: Dp,
    val itemSpacing: Dp,
    val gridColumns: Int,
    val contentMaxWidth: Dp
) {
    val isUltraCompact: Boolean get() = tier == WindowWidthTier.ULTRA_COMPACT
    val isPhone: Boolean get() = tier == WindowWidthTier.ULTRA_COMPACT || tier == WindowWidthTier.COMPACT
    val isTabletOrDesktop: Boolean get() = tier == WindowWidthTier.MEDIUM || tier == WindowWidthTier.EXPANDED
    val isExpanded: Boolean get() = tier == WindowWidthTier.EXPANDED

    val screenContentPadding: PaddingValues
        get() = PaddingValues(horizontal = horizontalPadding, vertical = itemSpacing)
}

fun computeResponsiveMetrics(maxWidth: Dp): ResponsiveMetrics {
    val tier = when {
        maxWidth < 360.dp -> WindowWidthTier.ULTRA_COMPACT
        maxWidth < 600.dp -> WindowWidthTier.COMPACT
        maxWidth < 840.dp -> WindowWidthTier.MEDIUM
        else -> WindowWidthTier.EXPANDED
    }
    return when (tier) {
        WindowWidthTier.ULTRA_COMPACT -> ResponsiveMetrics(
            maxWidth = maxWidth,
            tier = tier,
            horizontalPadding = 12.dp,
            cardPadding = 12.dp,
            itemSpacing = 10.dp,
            gridColumns = 1,
            contentMaxWidth = 600.dp
        )
        WindowWidthTier.COMPACT -> ResponsiveMetrics(
            maxWidth = maxWidth,
            tier = tier,
            horizontalPadding = 16.dp,
            cardPadding = 14.dp,
            itemSpacing = 14.dp,
            gridColumns = 1,
            contentMaxWidth = 680.dp
        )
        WindowWidthTier.MEDIUM -> ResponsiveMetrics(
            maxWidth = maxWidth,
            tier = tier,
            horizontalPadding = 20.dp,
            cardPadding = 16.dp,
            itemSpacing = 16.dp,
            gridColumns = 2,
            contentMaxWidth = 960.dp
        )
        WindowWidthTier.EXPANDED -> ResponsiveMetrics(
            maxWidth = maxWidth,
            tier = tier,
            horizontalPadding = 24.dp,
            cardPadding = 16.dp,
            itemSpacing = 16.dp,
            gridColumns = 2,
            contentMaxWidth = 1120.dp
        )
    }
}

@Composable
fun rememberResponsiveMetrics(maxWidth: Dp): ResponsiveMetrics =
    remember(maxWidth) { computeResponsiveMetrics(maxWidth) }

/**
 * Centers content cleanly on tablets and desktops while letting smartphones use the full width
 * with zero horizontal overflow.
 */
@Composable
fun ResponsiveCenteredBox(
    maxContentWidth: Dp,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.TopCenter
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = maxContentWidth)
        ) {
            content()
        }
    }
}

/**
 * Renders items in 1 column on smartphones and 2 (or N) columns on tablets/desktops without
 * nested scrollable grids, making it safe inside LazyColumn items.
 */
@Composable
fun <T> ResponsiveCardGrid(
    items: List<T>,
    columns: Int,
    horizontalSpacing: Dp = 12.dp,
    verticalSpacing: Dp = 12.dp,
    modifier: Modifier = Modifier,
    itemContent: @Composable (T) -> Unit
) {
    val safeCols = columns.coerceAtLeast(1)
    if (safeCols == 1) {
        Column(
            modifier = modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(verticalSpacing)
        ) {
            items.forEach { item ->
                itemContent(item)
            }
        }
    } else {
        Column(
            modifier = modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(verticalSpacing)
        ) {
            items.chunked(safeCols).forEach { rowItems ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(horizontalSpacing),
                    verticalAlignment = Alignment.Top
                ) {
                    rowItems.forEach { item ->
                        Box(modifier = Modifier.weight(1f)) {
                            itemContent(item)
                        }
                    }
                    repeat(safeCols - rowItems.size) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

/**
 * Prevents accidental rapid double-taps / double-submissions on touchscreen buttons.
 */
@Composable
fun rememberDebouncedAction(
    debounceMs: Long = 600L,
    action: () -> Unit
): () -> Unit {
    val lastClickRef = remember { LongArray(1) { 0L } }
    return remember(debounceMs, action) {
        {
            val now = SystemClock.elapsedRealtime()
            if (now - lastClickRef[0] >= debounceMs) {
                lastClickRef[0] = now
                action()
            }
        }
    }
}
