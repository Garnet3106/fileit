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
            panel1: '#131314b2',
            panel2: '#36373bb2',
        },
        border1: '#666666b2',
        border2: '#36373bb2',
        font: '',
    },
};
