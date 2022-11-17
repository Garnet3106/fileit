import { ItemPath } from "./item";
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

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
};

export type RootState = ReturnType<typeof store.getState>;

export const store = configureStore({
    reducer: {
        currentFolderPath: slices.currentFolderPath.reducer,
        selectedItemPaths: slices.selectedItemPaths.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});
