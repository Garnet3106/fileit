import { ItemPath } from "./item";
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

export const slices = {
    currentFolderPath: createSlice({
        name: 'currentFolderPath',
        initialState: null as ItemPath | null,
        reducers: {
            update: (state, action: PayloadAction<ItemPath>) => action.payload,
        },
    }),
};

export type RootState = ReturnType<typeof store.getState>;

export const store = configureStore({
    reducer: {
        currentFolderPath: slices.currentFolderPath.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});
