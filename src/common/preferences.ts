export type HexColor = string;
export type FontFamily = string;

export enum Language {
    EnglishUs,
    Japanese,
}

export enum AppearanceTheme {
    Light = 'light',
    Dark = 'dark',
}

export class PreferenceManager {
    static getAppearancePreset(theme: AppearanceTheme): AppearanceThemePreset {
        const preset = appearances.get(theme);

        if (preset === undefined) {
            console.warn('Appearance is not found.');
        }

        return preset ?? darkAppearanceThemePreset;
    }

    static toCssVariableMap(preferences: Preferences): {
        [index: string]: any,
    } {
        const appearanceThemePreset = PreferenceManager.getAppearancePreset(preferences.appearance.theme);

        return {
            '--font-color': appearanceThemePreset.font.first,
            '--dark-font-color': appearanceThemePreset.font.second,
            '--panel1-color': appearanceThemePreset.background.front,
            '--panel2-color': appearanceThemePreset.background.back,
            '--border-color': appearanceThemePreset.border,
            '--selected-tab-color': appearanceThemePreset.tab.selected,
            '--unselected-tab-color': appearanceThemePreset.tab.unselected,
        };
    }

    static save() {
        console.log('saved');
    }
}

export type Preferences = {
    appearance: {
        theme: AppearanceTheme,
        language: Language,
        font: FontFamily,
    },
}

export type AppearanceThemePreset = {
    background: {
        front: HexColor,
        back: HexColor,
    },
    border: HexColor,
    font: {
        first: HexColor,
        second: HexColor,
    },
    tab: {
        selected: HexColor,
        unselected: HexColor,
    },
}

// It will be used as default appearance.
const darkAppearanceThemePreset: AppearanceThemePreset = {
    background: {
        front: '#131314',
        back: '#2e2f30',
    },
    border: '#555555',
    font: {
        first: '#ffffff',
        second: '#bbbbbb',
    },
    tab: {
        selected: '#131314',
        unselected: '#4a4a50',
    },
};

export const appearances = new Map<AppearanceTheme, AppearanceThemePreset>([
    [
        AppearanceTheme.Dark,
        darkAppearanceThemePreset,
    ],
]);

export const defaultPreferences: Preferences = {
    appearance: {
        theme: AppearanceTheme.Dark,
        language: Language.Japanese,
        font: 'sans-serif',
    },
};
