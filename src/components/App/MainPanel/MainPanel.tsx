import { preferences } from '../../../common/preferences';
import { variables as leftPanelVariables } from '../LeftPanel/LeftPanel';
import ContentPane from './ContentPane/ContentPane';
import DetailBar from './DetailBar/DetailBar';
import OperationPane from './OperationPane/OperationPane';
import TabPane from './TabPane/TabPane';
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
            <TabPane />
            <OperationPane />
            <ContentPane />
            <DetailBar />
        </div>
    );
}
