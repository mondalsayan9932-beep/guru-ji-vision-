package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val LightColorScheme = lightColorScheme(
    primary = ForestEmerald,
    onPrimary = Color.White,
    primaryContainer = SageContainer,
    onPrimaryContainer = OnSageContainer,
    secondary = HarvestAmber,
    onSecondary = Color.White,
    secondaryContainer = AmberContainer,
    onSecondaryContainer = OnAmberContainer,
    tertiary = EarthTerracotta,
    onTertiary = Color.White,
    tertiaryContainer = SoilContainer,
    onTertiaryContainer = OnSoilContainer,
    background = WarmIvory,
    onBackground = DeepSlateInk,
    surface = SoftCreamSurface,
    onSurface = DeepSlateInk,
    surfaceVariant = SurfaceCardLight,
    onSurfaceVariant = MutedMossText,
    outline = SubtleSageBorder,
    outlineVariant = SurfaceTintLight,
    error = ErrorCrimson,
    errorContainer = ErrorContainerLight
)

private val DarkColorScheme = darkColorScheme(
    primary = MintLightPrimary,
    onPrimary = OnMintDark,
    primaryContainer = DarkPrimaryContainer,
    onPrimaryContainer = SageContainer,
    secondary = DarkAmber,
    onSecondary = OnDarkAmber,
    secondaryContainer = DarkAmberContainer,
    onSecondaryContainer = AmberContainer,
    tertiary = Color(0xFFFDBA74),
    onTertiary = OnSoilContainer,
    background = DarkCanopyBg,
    onBackground = DarkInk,
    surface = DarkSurface,
    onSurface = DarkInk,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = DarkMutedInk,
    outline = DarkBorder
)

val GuruJiShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

@Composable
fun GuruJiVisionTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    isBengali: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = guruJiTypography(isBengali = isBengali),
        shapes = GuruJiShapes,
        content = content
    )
}
