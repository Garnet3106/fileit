export enum ColorTheme {
    Light = 'light',
    Dark = 'dark',
}

export type ColorString = string;

export type Preferences = {
    appearance: {
        theme: ColorTheme,
        background: {
            app: ColorString,
            panel1: ColorString,
            panel2: ColorString,
        },
        border1: ColorString,
        border2: ColorString,
        font: ColorString,
    },
};

export let preferences: Preferences = {
    appearance: {
        theme: ColorTheme.Dark,
        background: {
            app: '',
            panel1: '#131314eb',
            panel2: '#1f2022eb',
        },
        border1: '#666666eb',
        border2: '#1f2022eb',
        font: '',
    },
};
