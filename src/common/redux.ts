import { enableMapSet } from 'immer';
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PopupItemData } from "../components/common/PopupList/PopupItem/PopupItem";
import { ItemPath } from './fs/path';
import { generateUuid } from './utils';
import { Item, ItemSortOrder } from './fs/item';
import { Tab } from './tab';

export type TabState = {
    tabs: Tab[],
    selected: Tab | null,
};

// fix
enableMapSet();

export const slices = {
    tab: createSlice({
        name: 'tab',
        initialState: {
            tabs: [],
            selected: null,
        } as TabState,
        reducers: {
            open: (state, action: PayloadAction<ItemPath>) => {
                const newState = Object.assign({}, state);
                const newTab = {
                    id: generateUuid(),
                    path: action.payload,
                };

                newState.tabs = [...newState.tabs, newTab];
                newState.selected = newTab;
                return newState;
            },
            close: (state, action: PayloadAction<string>) => {
                const findNextSelected = () => {
                    const tmpSrcIndex = state.tabs.findIndex((eachTab) => eachTab.id === action.payload);
                    const srcIndex = tmpSrcIndex === -1 ? undefined : tmpSrcIndex;

                    if (srcIndex === undefined) {
                        return null;
                    }

                    if (srcIndex === 0) {
                        return state.tabs.length === 1 ? null : state.tabs[1];
                    }

                    return state.tabs[srcIndex - 1];
                };

                const newState = Object.assign({}, state);
                newState.tabs = state.tabs.filter((eachTab) => eachTab.id !== action.payload);
                newState.selected = findNextSelected();
                return newState;
            },
            select: (state, action: PayloadAction<string>) => {
                const targetIndex = state.tabs.findIndex((v) => v.id === action.payload);

                if (targetIndex === -1) {
                    console.error('Tab ID not found.');
                    return state;
                }

                const newState = Object.assign({}, state);
                newState.selected = state.tabs[targetIndex];
                return newState;
            },
            changePath: (state, action: PayloadAction<ItemPath>) => {
                const newState = Object.assign({}, state);
                const targetIndex = newState.tabs.findIndex((v) => v.id === state.selected?.id);

                if (targetIndex === -1) {
                    console.error('Tab ID not found.');
                    return state;
                }

                const target = state.tabs[targetIndex];

                const changedTab = {
                    id: target.id,
                    path: action.payload,
                };

                newState.tabs = newState.tabs.concat();
                newState.tabs[targetIndex] = changedTab;
                newState.selected = changedTab;
                return newState;
            },
        },
    }),
    currentFolderChildren: createSlice({
        name: 'currentFolderChildren',
        initialState: [] as Item[],
        reducers: {
            update: (_state, action: PayloadAction<Item[]>) => action.payload,
        },
    }),
    itemSortOrder: createSlice({
        name: 'itemSortOrder',
        initialState: ItemSortOrder.NameAscend,
        reducers: {
            update: (_state, action: PayloadAction<ItemSortOrder>) => action.payload,
        },
    }),
    // fix: move into tab state
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
    showPathEditBar: createSlice({
        name: 'showPathEditBar',
        initialState: false,
        reducers: {
            update: (_state, action: PayloadAction<boolean>) => action.payload,
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
            add: (state, action: PayloadAction<PopupItemData & {
                id?: string,
            }>) => {
                const id = action.payload.id ?? generateUuid();

                if (state.has(id)) {
                    console.error('Popup ID is unexpectedly duplicate.');
                    return state;
                }

                const newState = new Map(state);
                newState.set(id, action.payload);
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
            changeDescription: (state, action: PayloadAction<{
                id: string,
                value: string,
            }>) => {
                const newState = new Map(state);
                const target = Object.assign({}, newState.get(action.payload.id));

                if (target !== undefined) {
                    target.description = action.payload.value;
                }

                newState.set(action.payload.id, target);
                return newState;
            },
            changeProgress: (state, action: PayloadAction<{
                id: string,
                value: number,
            }>) => {
                const newState = new Map(state);
                const target = Object.assign({}, newState.get(action.payload.id));

                if (target !== undefined) {
                    target.progress = action.payload.value;
                }

                newState.set(action.payload.id, target);
                return newState;
            },
        },
    }),
};

export type RootState = ReturnType<typeof store.getState>;

export const store = configureStore({
    reducer: {
        tab: slices.tab.reducer,
        currentFolderChildren: slices.currentFolderChildren.reducer,
        itemSortOrder: slices.itemSortOrder.reducer,
        selectedItemPaths: slices.selectedItemPaths.reducer,
        showPathEditBar: slices.showPathEditBar.reducer,
        renamingItemPath: slices.renamingItemPath.reducer,
        popups: slices.popups.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});
