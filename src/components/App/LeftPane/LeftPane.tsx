import { variables as tabPaneVariables } from '../MainPanel/TabPane/TabPane';
import { preferences } from '../../../common/preferences';
import './LeftPane.css';
import LeftPaneGroup from './LeftPaneGroup/LeftPaneGroup';
import { ItemPath } from '../../../common/fs/path';
import { LeftPaneItemData } from './LeftPaneGroup/LeftPaneItem/LeftPaneItem';
import { useEffect, useState } from 'react';
import { homeDirectoryPath, platform } from '../../../common/utils';

export const variables = {
    width: 150,
};

export default function LeftPane() {
    const styles = {
        top: {
            borderColor: preferences.appearance.border1,
            height: tabPaneVariables.height,
        },
    };

    const [fixedGroupItems, setFixedGroupItems] = useState<LeftPaneItemData[]>([]);

    useEffect(() => {
        const updateGroup = (rootPath: ItemPath, homePath: ItemPath) => {
            const items: LeftPaneItemData[] = [
                {
                    path: rootPath,
                },
                {
                    path: homePath,
                },
                {
                    path: homePath.append('Desktop', true),
                },
                {
                    path: homePath.append('Downloads', true),
                },
                {
                    path: homePath.append('Documents', true),
                },
                {
                    path: homePath.append('Pictures', true),
                },
            ];

            setFixedGroupItems(items);
        }

        platform.get((platform) => {
            homeDirectoryPath.get((homeDirectoryPath) => {
                updateGroup(
                    ItemPath.getRoot(platform),
                    homeDirectoryPath,
                );
            });
        });
    }, []);

    return (
        <div className="left-pane-container" style={{
            backgroundColor: preferences.appearance.background.panel1,
            width: variables.width,
        }}>
            <div className="left-pane-top" style={styles.top}>
                FileMe
            </div>
            <LeftPaneGroup items={fixedGroupItems} />
        </div>
    );
}
