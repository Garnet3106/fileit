import { preferences } from '../../../preferences';
import { variables as leftPanelVariables } from '../LeftPanel/LeftPanel';
import ContentPanel from './ContentPanel/ContentPanel';
import DetailBar from './DetailBar/DetailBar';
import OperationBar from './OperationBar/OperationBar';
import TabBar from './TabBar/TabBar';
import './MainPanel.css';
import { FileItemIdentifier, Item } from '../../../item';

export default function MainPanel() {
    const containerBorderWidth = 1;

    const styles = {
        container: {
            borderLeft: `${containerBorderWidth}px solid ${preferences.appearance.border2}`,
            width: `calc(100% - ${leftPanelVariables.width + containerBorderWidth}px)`,
        },
    };

    const items: Item[] = [
        Item.folder({
            id: 'Folder1',
            lastModified: new Date(),
        }),
        Item.file({
            id: new FileItemIdentifier('image', 'png'),
            size: 1024,
            lastModified: new Date(),
        }),
        Item.folder({
            id: 'Folder1',
            lastModified: new Date(),
        }),
        Item.file({
            id: new FileItemIdentifier('image', 'png'),
            size: 1024,
            lastModified: new Date(),
        }),
        Item.folder({
            id: 'Folder1',
            lastModified: new Date(),
        }),
        Item.file({
            id: new FileItemIdentifier('image', 'png'),
            size: 1024,
            lastModified: new Date(),
        }),
    ];

    return (
        <div className="main-panel-container" style={styles.container}>
            <TabBar />
            <OperationBar />
            <ContentPanel items={items} />
            <DetailBar />
        </div>
    );
}
