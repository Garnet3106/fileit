import { preferences } from '../../../preferences';
import { variables as leftPanelVariables } from '../LeftPanel/LeftPanel';
import ContentPanel from './ContentPanel/ContentPanel';
import DetailBar from './DetailBar/DetailBar';
import OperationBar from './OperationBar/OperationBar';
import TabBar from './TabBar/TabBar';
import './MainPanel.css';

export default function MainPanel() {
    const containerBorderWidth = 1;

    const styles = {
        container: {
            borderLeft: `${containerBorderWidth}px solid ${preferences.appearance.border2}`,
            width: `calc(100% - ${leftPanelVariables.width + containerBorderWidth}px)`,
        },
    };

    return (
        <div className="main-panel-container" style={styles.container}>
            <TabBar />
            <OperationBar />
            <ContentPanel />
            <DetailBar />
        </div>
    );
}
