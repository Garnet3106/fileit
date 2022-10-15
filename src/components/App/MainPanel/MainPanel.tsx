import { preferences } from '../../../common/preferences';
import { variables as leftPanelVariables } from '../LeftPanel/LeftPanel';
import ContentPanel from './ContentPanel/ContentPanel';
import DetailBar from './DetailBar/DetailBar';
import OperationBar from './OperationBar/OperationBar';
import TabBar from './TabBar/TabBar';
import './MainPanel.css';

export const variables = {
    width: `calc(100vw - ${leftPanelVariables.width + 1}px)`,
};

export default function MainPanel() {
    const containerBorderWidth = 1;

    const styles = {
        container: {
            borderLeft: `${containerBorderWidth}px solid ${preferences.appearance.border2}`,
            width: variables.width,
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
