import { ItemPath } from "./item";
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type State = {
    path: ItemPath,
};

export const slices = {
    path: createSlice({
        name: 'path',
        initialState: new ItemPath([], '', true),
        reducers: {
            update: (state, action: PayloadAction<ItemPath>) => state = action.payload,
        },
    }),
};

export type RootState = ReturnType<typeof store.getState>;

export const store = configureStore({
    reducer: {
        path: slices.path.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});
