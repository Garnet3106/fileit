import { enableMapSet } from 'immer';
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PopupItemData } from "../components/App/PopupList/PopupItem/PopupItem";
import { ItemPath } from './fs/path';
import { generateUuid } from './utils';

// fix
enableMapSet();

export const slices = {
    currentFolderPath: createSlice({
        name: 'currentFolderPath',
        initialState: null as ItemPath | null,
        reducers: {
            update: (_state, action: PayloadAction<ItemPath>) => action.payload,
        },
    }),
    selectedItemPaths: createSlice({
        name: 'selectedItemPaths',
        initialState: [] as ItemPath[],
        reducers: {
            update: (_state, action: PayloadAction<ItemPath[]>) => action.payload,
            add: (state, action: PayloadAction<ItemPath>) => {
                if (state.some((v) => v.isEqual(action.payload))) {
                    return state;
                }

                const newState = state.concat();
                newState.push(action.payload);
                return newState;
            },
            remove: (state, action: PayloadAction<ItemPath>) => {
                const index = state.findIndex((v) => v.isEqual(action.payload));

                if (index === -1) {
                    return state;
                }

                const newState = state.concat();
                newState.splice(index, 1);
                return newState;
            },
        },
    }),
    renamingItemPath: createSlice({
        name: 'renamingItemPath',
        initialState: null as ItemPath | null,
        reducers: {
            update: (_state, action: PayloadAction<ItemPath | null>) => action.payload,
        },
    }),
    popups: createSlice({
        name: 'popups',
        initialState: new Map<string, PopupItemData>(),
        reducers: {
            add: (state, action: PayloadAction<PopupItemData>) => {
                const uuid = generateUuid();

                if (state.has(uuid)) {
                    console.error('Popup ID is unexpectedly duplicate.');
                    return state;
                }

                const newState = new Map(state);
                newState.set(uuid, action.payload);
                return newState;
            },
            remove: (state, action: PayloadAction<string>) => {
                if (!state.has(action.payload)) {
                    return state;
                }

                const newState = new Map(state);
                newState.delete(action.payload);
                return newState;
            },
        },
    }),
};

export type RootState = ReturnType<typeof store.getState>;

export const store = configureStore({
    reducer: {
        currentFolderPath: slices.currentFolderPath.reducer,
        selectedItemPaths: slices.selectedItemPaths.reducer,
        renamingItemPath: slices.renamingItemPath.reducer,
        popups: slices.popups.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});
